import Trip from '../models/trip.model.js';
import Vehicle from '../models/vehicle.model.js';
import User from '../models/user.model.js';
import { Op } from 'sequelize';
import { getPagination, getPagingData } from '../utils/pagination.js';
import { eventBus, FLEET_EVENTS } from '../events/eventBus.js';

class ApiError extends Error {
  constructor(statusCode, message, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}


const parseDate = (s) => new Date(s);

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

const VALID_TRANSITIONS = {
  scheduled: ['ongoing', 'cancelled'],
  ongoing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};


const findTripOrFail = async (id) => {
  const trip = await Trip.findByPk(id);
  if (!trip) throw new ApiError(404, 'Trip not found', 'NOT_FOUND');
  return trip;
};

const assertDriverAccess = (trip, currentUser) => {
  if (currentUser.role === 'DRIVER' && trip.userId !== currentUser.id) {
    throw new ApiError(403, 'Access denied', 'FORBIDDEN');
  }
};

const assertNotCompleted = (trip) => {
  if (trip.status === 'completed') {
    throw new ApiError(409, 'Cannot modify a completed trip', 'CONFLICT');
  }
};

const assertNotCancelled = (trip) => {
  if (trip.status === 'cancelled') {
    throw new ApiError(409, 'Cannot modify a cancelled trip', 'CONFLICT');
  }
};

const assertValidTimeRange = (start, end) => {
  const s = parseDate(start);
  const e = parseDate(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) {
    throw new ApiError(422, 'Invalid date format for startTime or endTime', 'VALIDATION_ERROR');
  }
  if (s >= e) {
    throw new ApiError(422, 'startTime must be before endTime', 'VALIDATION_ERROR');
  }
};

const assertNoVehicleOverlap = async (vehicleId, start, end, excludeTripId = null) => {
  const s = parseDate(start);
  const e = parseDate(end);

  const where = {
    vehicleId,
    status: { [Op.notIn]: ['cancelled'] },
    startTime: { [Op.lt]: e },
    endTime: { [Op.gt]: s },
  };
  if (excludeTripId) where.id = { [Op.ne]: excludeTripId };

  const conflict = await Trip.findOne({ where });
  if (conflict) {
    throw new ApiError(409, 'Vehicle is already assigned to another trip in this time range', 'CONFLICT');
  }
};

const assertNoDriverOverlap = async (userId, start, end, excludeTripId = null) => {
  const s = parseDate(start);
  const e = parseDate(end);

  const where = {
    userId,
    status: { [Op.notIn]: ['cancelled'] },
    startTime: { [Op.lt]: e },
    endTime: { [Op.gt]: s },
  };
  if (excludeTripId) where.id = { [Op.ne]: excludeTripId };

  const conflict = await Trip.findOne({ where });
  if (conflict) {
    throw new ApiError(409, 'Driver is already assigned to another trip in this time range', 'CONFLICT');
  }
};

const assertTransition = (currentStatus, nextStatus) => {
  const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new ApiError(
      409,
      `Cannot transition trip from '${currentStatus}' to '${nextStatus}'`,
      'CONFLICT'
    );
  }
};

const resolveManagerId = (trip, currentUser) => {
  if (trip?.managerId) return trip.managerId;
  if (currentUser?.role === 'MANAGER') return currentUser.id;
  return null;
};


export const createTrip = async (payload, currentUser) => {
  assertValidTimeRange(payload.startTime, payload.endTime);

  if (payload.vehicleId) {
    await assertNoVehicleOverlap(payload.vehicleId, payload.startTime, payload.endTime);
  }
  if (payload.userId) {
    await assertNoDriverOverlap(payload.userId, payload.startTime, payload.endTime);
  }

  const trip = await Trip.create({ ...payload, status: 'scheduled' });

  if (trip.userId) {
    try {
      eventBus.emitEvent(FLEET_EVENTS.TRIP_ASSIGNED, {
        trip,
        driverId: trip.userId,
        managerId: resolveManagerId(trip, currentUser),
        vehicleId: trip.vehicleId ?? null,
      });
    } catch (err) {
      console.error('[EventBus] TRIP_ASSIGNED publish failed:', err);
    }
  }

  return trip;
};

export const listTrips = async (query, currentUser) => {
  const { page, limit, offset } = getPagination(query);

  const where = {};
  if (query.status) where.status = query.status;
  if (query.vehicleId) where.vehicleId = query.vehicleId;
  if (query.userId) where.userId = query.userId;

  if (currentUser.role === 'DRIVER') where.userId = currentUser.id;

  const { count, rows } = await Trip.findAndCountAll({
    where,
    limit,
    offset,
    order: [['startTime', 'DESC']],
  });

  return getPagingData(count, rows, page, limit);
};

export const getTripById = async (id, currentUser) => {
  const trip = await findTripOrFail(id);
  assertDriverAccess(trip, currentUser);
  return trip;
};

export const updateTrip = async (id, payload, currentUser) => {
  const trip = await findTripOrFail(id);
  assertDriverAccess(trip, currentUser);
  assertNotCompleted(trip);
  assertNotCancelled(trip);

  const newStart = payload.startTime ?? trip.startTime;
  const newEnd = payload.endTime ?? trip.endTime;
  assertValidTimeRange(newStart, newEnd);

  if (payload.vehicleId || payload.startTime || payload.endTime) {
    await assertNoVehicleOverlap(payload.vehicleId ?? trip.vehicleId, newStart, newEnd, id);
  }
  if (payload.userId || payload.startTime || payload.endTime) {
    await assertNoDriverOverlap(payload.userId ?? trip.userId, newStart, newEnd, id);
  }

  await trip.update(payload);
  return trip;
};

export const updateTripStatus = async (id, status, currentUser) => {
  const trip = await findTripOrFail(id);
  assertDriverAccess(trip, currentUser);
  assertTransition(trip.status, status);
  await trip.update({ status });

  const managerId = resolveManagerId(trip, currentUser);
  if (status === 'ongoing') {
    try {
      eventBus.emitEvent(FLEET_EVENTS.TRIP_STARTED, {
        trip,
        driverId: trip.userId,
        managerId,
      });
    } catch (err) {
      console.error('[EventBus] TRIP_STARTED publish failed:', err);
    }
  }

  if (status === 'completed') {
    try {
      eventBus.emitEvent(FLEET_EVENTS.TRIP_COMPLETED, {
        trip,
        driverId: trip.userId,
        managerId,
      });
    } catch (err) {
      console.error('[EventBus] TRIP_COMPLETED publish failed:', err);
    }
  }

  if (status === 'cancelled') {
    try {
      eventBus.emitEvent(FLEET_EVENTS.TRIP_CANCELLED, {
        trip,
        driverId: trip.userId,
        managerId,
        reason: null,
      });
    } catch (err) {
      console.error('[EventBus] TRIP_CANCELLED publish failed:', err);
    }
  }

  return trip;
};

export const deleteTrip = async (id, currentUser) => {
  const trip = await findTripOrFail(id);
  assertDriverAccess(trip, currentUser);   
  assertNotCompleted(trip);                
  await trip.destroy();
};



export const assignDriverToTrip = async (id, userId, currentUser) => {
  const trip = await findTripOrFail(id);
  assertNotCompleted(trip);
  assertNotCancelled(trip);

  const user = await User.findByPk(userId);
  if (!user) throw new ApiError(404, 'Driver not found', 'NOT_FOUND');
  if (user.role !== 'DRIVER') {
    throw new ApiError(422, 'Assigned user must have DRIVER role', 'VALIDATION_ERROR');
  }

  await assertNoDriverOverlap(userId, trip.startTime, trip.endTime, id);

  await trip.update({ userId });

  try {
    eventBus.emitEvent(FLEET_EVENTS.TRIP_ASSIGNED, {
      trip,
      driverId: userId,
      managerId: resolveManagerId(trip, currentUser),
      vehicleId: trip.vehicleId ?? null,
    });
  } catch (err) {
    console.error('[EventBus] TRIP_ASSIGNED publish failed:', err);
  }

  return trip;
};

export const unassignDriverFromTrip = async (id, currentUser) => {
  const trip = await findTripOrFail(id);
  assertNotCompleted(trip);
  assertNotCancelled(trip);
  await trip.update({ userId: null });
  return trip;
};


export const startTrip = async (id, currentUser) => {
  const trip = await findTripOrFail(id);
  assertDriverAccess(trip, currentUser);
  assertTransition(trip.status, 'ongoing');
  await trip.update({ status: 'ongoing' });

  try {
    eventBus.emitEvent(FLEET_EVENTS.TRIP_STARTED, {
      trip,
      driverId: trip.userId,
      managerId: resolveManagerId(trip, currentUser),
    });
  } catch (err) {
    console.error('[EventBus] TRIP_STARTED publish failed:', err);
  }

  return trip;
};

export const completeTrip = async (id, payload, currentUser) => {
  const trip = await findTripOrFail(id);
  assertDriverAccess(trip, currentUser);
  assertTransition(trip.status, 'completed');

  const updates = { status: 'completed' };
  if (payload.endTime) updates.endTime = payload.endTime;
  if (payload.cost !== undefined) updates.cost = payload.cost;
  if (payload.fuel !== undefined) updates.fuel = payload.fuel;

  await trip.update(updates);

  try {
    eventBus.emitEvent(FLEET_EVENTS.TRIP_COMPLETED, {
      trip,
      driverId: trip.userId,
      managerId: resolveManagerId(trip, currentUser),
    });
  } catch (err) {
    console.error('[EventBus] TRIP_COMPLETED publish failed:', err);
  }

  return trip;
};

export const cancelTrip = async (id, currentUser) => {
  const trip = await findTripOrFail(id);
  assertDriverAccess(trip, currentUser);
  assertTransition(trip.status, 'cancelled');
  await trip.update({ status: 'cancelled' });

  try {
    eventBus.emitEvent(FLEET_EVENTS.TRIP_CANCELLED, {
      trip,
      driverId: trip.userId,
      managerId: resolveManagerId(trip, currentUser),
      reason: null,
    });
  } catch (err) {
    console.error('[EventBus] TRIP_CANCELLED publish failed:', err);
  }

  return trip;
};


export const getLiveLocation = async (id, currentUser) => {
  const trip = await findTripOrFail(id);
  assertDriverAccess(trip, currentUser);

  if (trip.status !== 'ongoing') {
    throw new ApiError(409, 'Live location is only available for ongoing trips', 'CONFLICT');
  }

  return { tripId: id, message: 'Live location tracking not yet integrated' };
};

export const recordLocationPing = async (id, payload, currentUser) => {
  const trip = await findTripOrFail(id);
  assertDriverAccess(trip, currentUser);

  if (trip.status !== 'ongoing') {
    throw new ApiError(409, 'Cannot record location for a non-ongoing trip', 'CONFLICT');
  }

  const { latitude, longitude, speed, recordedAt } = payload;
  if (latitude == null || longitude == null) {
    throw new ApiError(422, 'latitude and longitude are required', 'VALIDATION_ERROR');
  }

  return { tripId: id, latitude, longitude, speed, recordedAt: recordedAt || new Date() };
};

export const getTripHistory = async (id, currentUser) => {
  const trip = await findTripOrFail(id);
  assertDriverAccess(trip, currentUser);

  return { tripId: id, events: [] };
};