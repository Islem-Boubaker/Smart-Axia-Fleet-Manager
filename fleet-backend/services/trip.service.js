import { Op } from "sequelize";
import { sequelize } from "../config/connectdb.js";
import { getPagingData } from "../utils/pagination.js";
import Trip from "../models/trip.model.js";
import TripStop from "../models/TripStop.js";
import User from "../models/user.model.js";
import Vehicle from "../models/vehicle.model.js";
import { checkVehicleAvailableForTrip } from "./maintenance.service.js";
import { eventBus, FLEET_EVENTS } from "../events/eventBus.js";

const TRIP_STATUS = {
  SCHEDULED: "scheduled",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const VALID_TRANSITIONS = {
  [TRIP_STATUS.SCHEDULED]: [TRIP_STATUS.ONGOING, TRIP_STATUS.CANCELLED],
  [TRIP_STATUS.ONGOING]: [TRIP_STATUS.COMPLETED, TRIP_STATUS.CANCELLED],
  [TRIP_STATUS.COMPLETED]: [],
  [TRIP_STATUS.CANCELLED]: [],
};

const createError = (message, status = 400, code = "BAD_REQUEST") => {
  const error = new Error(message);
  error.status = status;
  error.statusCode = status;
  error.code = code;
  return error;
};

const ensureTripExists = async (tripId, includeStops = false) => {
  const trip = await Trip.findByPk(tripId, {
    include: includeStops ? [{ model: TripStop, as: "stops" }] : [],
    order: includeStops ? [[{ model: TripStop, as: "stops" }, "stopOrder", "ASC"]] : [],
  });

  if (!trip) {
    throw createError("Trip not found", 404, "NOT_FOUND");
  }

  return trip;
};

const ensureDriverOwnership = (trip, callerRole, callerId) => {
  if (callerRole === "DRIVER" && String(trip.userId) !== String(callerId)) {
    throw createError("Access denied", 403, "FORBIDDEN");
  }
};

const ensureMutableTrip = (trip) => {
  if (trip.status === TRIP_STATUS.COMPLETED || trip.status === TRIP_STATUS.CANCELLED) {
    throw createError("Cannot modify completed or cancelled trip", 409, "CONFLICT");
  }
};

const normalizeWindow = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date(start.getTime() + 60 * 60 * 1000);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw createError("Invalid startTime or endTime", 422, "VALIDATION_ERROR");
  }

  if (start >= end) {
    throw createError("startTime must be before endTime", 422, "VALIDATION_ERROR");
  }

  return { start, end };
};

const validateVehicle = async (vehicleId) => {
  const vehicle = await Vehicle.findByPk(vehicleId);
  if (!vehicle) {
    throw createError("Vehicle not found", 404, "NOT_FOUND");
  }

  if (["IN_MAINTENANCE", "OUT_OF_SERVICE"].includes(vehicle.status)) {
    throw createError("Vehicle is not operational", 409, "CONFLICT");
  }

  return vehicle;
};

const validateDriver = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw createError("Driver not found", 404, "NOT_FOUND");
  }
  if (user.role !== "DRIVER") {
    throw createError("Assigned user must be a DRIVER", 422, "VALIDATION_ERROR");
  }
  return user;
};

const buildOverlapWhere = ({ targetField, targetId, start, end, excludeTripId = null }) => {
  const where = {
    [targetField]: targetId,
    status: { [Op.ne]: TRIP_STATUS.CANCELLED },
    [Op.and]: [
      { startTime: { [Op.lt]: end } },
      {
        [Op.or]: [
          { endTime: { [Op.gt]: start } },
          { endTime: { [Op.is]: null } },
        ],
      },
    ],
  };

  if (excludeTripId) {
    where.id = { [Op.ne]: excludeTripId };
  }

  return where;
};

const ensureNoVehicleOverlap = async ({ vehicleId, start, end, excludeTripId = null }) => {
  const conflict = await Trip.findOne({
    where: buildOverlapWhere({
      targetField: "vehicleId",
      targetId: vehicleId,
      start,
      end,
      excludeTripId,
    }),
  });

  if (conflict) {
    throw createError("Vehicle already has an overlapping trip", 409, "CONFLICT");
  }
};

const ensureNoDriverOverlap = async ({ userId, start, end, excludeTripId = null }) => {
  if (!userId) return;

  const conflict = await Trip.findOne({
    where: buildOverlapWhere({
      targetField: "userId",
      targetId: userId,
      start,
      end,
      excludeTripId,
    }),
  });

  if (conflict) {
    throw createError("Driver already has an overlapping trip", 409, "CONFLICT");
  }
};

const emitTripEvent = (event, payload) => {
  try {
    eventBus.emitEvent(event, payload);
  } catch (error) {
    console.error(`[EventBus] Failed to emit ${event}:`, error.message);
  }
};

const fetchTripWithStops = async (tripId) => {
  return Trip.findByPk(tripId, {
    include: [{ model: TripStop, as: "stops" }],
    order: [[{ model: TripStop, as: "stops" }, "stopOrder", "ASC"]],
  });
};

export const createTrip = async (data) => {
  const { start, end } = normalizeWindow(data.startTime, data.endTime);

  await validateVehicle(data.vehicleId);
  await checkVehicleAvailableForTrip(data.vehicleId, start, end);
  if (data.userId) {
    await validateDriver(data.userId);
  }

  await ensureNoVehicleOverlap({ vehicleId: data.vehicleId, start, end });
  await ensureNoDriverOverlap({ userId: data.userId, start, end });

  const result = await sequelize.transaction(async (transaction) => {
    const { stops = [], ...tripInput } = data;

    const trip = await Trip.create(
      {
        ...tripInput,
        status: TRIP_STATUS.SCHEDULED,
      },
      { transaction }
    );

    if (Array.isArray(stops) && stops.length > 0) {
      const stopRows = stops.map((stop) => ({ ...stop, tripId: trip.id }));
      await TripStop.bulkCreate(stopRows, { transaction, validate: true });
    }

    return trip;
  });

  if (result.userId) {
    emitTripEvent(FLEET_EVENTS.TRIP_ASSIGNED, {
      tripId: result.id,
      userId: result.userId,
    });
  }

  return fetchTripWithStops(result.id);
};

export const getTrips = async (filters = {}, pagination = {}, callerRole, callerId) => {
  const where = {};

  if (filters.status) where.status = filters.status;
  if (filters.vehicleId) where.vehicleId = filters.vehicleId;
  if (filters.userId) where.userId = filters.userId;
  if (filters.region) where.region = filters.region;

  if (callerRole === "DRIVER") {
    where.userId = callerId;
  }

  const includeStops = filters.includeStops === true || filters.includeStops === "true";
  const page = Math.max(Number(pagination.page || 1), 1);
  const limit = Math.min(Math.max(Number(pagination.limit || 10), 1), 100);
  const offset = (page - 1) * limit;

  const query = {
    where,
    limit,
    offset,
    order: [["startTime", "DESC"]],
  };

  if (includeStops) {
    query.include = [{ model: TripStop, as: "stops" }];
  }

  const { count, rows } = await Trip.findAndCountAll(query);

  if (includeStops) {
    for (const trip of rows) {
      if (Array.isArray(trip.stops)) {
        trip.stops.sort((a, b) => a.stopOrder - b.stopOrder);
      }
    }
  }

  return getPagingData(count, rows, page, limit);
};

export const getTripById = async (tripId, callerRole, callerId) => {
  const trip = await ensureTripExists(tripId, true);
  ensureDriverOwnership(trip, callerRole, callerId);

  if (Array.isArray(trip.stops)) {
    trip.stops.sort((a, b) => a.stopOrder - b.stopOrder);
  }

  return trip;
};

export const updateTrip = async (tripId, data) => {
  const trip = await ensureTripExists(tripId);
  ensureMutableTrip(trip);

  const nextVehicleId = data.vehicleId ?? trip.vehicleId;
  const nextUserId = data.userId !== undefined ? data.userId : trip.userId;
  const nextStart = data.startTime ?? trip.startTime;
  const nextEnd = data.endTime ?? trip.endTime;

  const { start, end } = normalizeWindow(nextStart, nextEnd);

  if (data.vehicleId) {
    await validateVehicle(nextVehicleId);
  }

  if (data.vehicleId || data.startTime || data.endTime) {
    await checkVehicleAvailableForTrip(nextVehicleId, start, end);
  }

  if (data.userId !== undefined && data.userId !== null) {
    await validateDriver(nextUserId);
  }

  await ensureNoVehicleOverlap({
    vehicleId: nextVehicleId,
    start,
    end,
    excludeTripId: tripId,
  });

  await ensureNoDriverOverlap({
    userId: nextUserId,
    start,
    end,
    excludeTripId: tripId,
  });

  await trip.update(data);
  return fetchTripWithStops(trip.id);
};

export const deleteTrip = async (tripId) => {
  const trip = await ensureTripExists(tripId);

  if (trip.status === TRIP_STATUS.COMPLETED) {
    throw createError("Cannot delete a completed trip", 409, "CONFLICT");
  }

  await trip.destroy();
  return null;
};

export const updateTripStatus = async (tripId, newStatus) => {
  const trip = await ensureTripExists(tripId);
  const allowed = VALID_TRANSITIONS[trip.status] ?? [];

  if (!allowed.includes(newStatus)) {
    throw createError(`Invalid transition from ${trip.status} to ${newStatus}`, 409, "CONFLICT");
  }

  await trip.update({ status: newStatus });

  if (newStatus === TRIP_STATUS.ONGOING) {
    emitTripEvent(FLEET_EVENTS.TRIP_STARTED, { tripId: trip.id, userId: trip.userId });
  }
  if (newStatus === TRIP_STATUS.COMPLETED) {
    emitTripEvent(FLEET_EVENTS.TRIP_COMPLETED, { tripId: trip.id, userId: trip.userId });
  }
  if (newStatus === TRIP_STATUS.CANCELLED) {
    emitTripEvent(FLEET_EVENTS.TRIP_CANCELLED, { tripId: trip.id, userId: trip.userId });
  }

  return trip;
};

export const startTrip = async (tripId, callerRole, callerId) => {
  const trip = await ensureTripExists(tripId);
  ensureDriverOwnership(trip, callerRole, callerId);

  if (trip.status !== TRIP_STATUS.SCHEDULED) {
    throw createError("Trip can only be started from scheduled status", 409, "CONFLICT");
  }

  await trip.update({ status: TRIP_STATUS.ONGOING });
  emitTripEvent(FLEET_EVENTS.TRIP_STARTED, { tripId: trip.id, userId: trip.userId });
  return trip;
};

export const completeTrip = async (tripId, callerRole, callerId, settlement = {}) => {
  const trip = await ensureTripExists(tripId);
  ensureDriverOwnership(trip, callerRole, callerId);

  if (trip.status !== TRIP_STATUS.ONGOING) {
    throw createError("Trip can only be completed from ongoing status", 409, "CONFLICT");
  }

  const updates = { status: TRIP_STATUS.COMPLETED };
  if (settlement.endTime) updates.endTime = settlement.endTime;
  if (settlement.cost !== undefined) updates.cost = settlement.cost;
  if (settlement.fuel !== undefined) updates.fuel = settlement.fuel;

  await trip.update(updates);
  emitTripEvent(FLEET_EVENTS.TRIP_COMPLETED, { tripId: trip.id, userId: trip.userId });
  return trip;
};

export const cancelTrip = async (tripId, callerRole, callerId) => {
  const trip = await ensureTripExists(tripId);
  ensureDriverOwnership(trip, callerRole, callerId);

  if (![TRIP_STATUS.SCHEDULED, TRIP_STATUS.ONGOING].includes(trip.status)) {
    throw createError("Trip can only be cancelled from scheduled or ongoing", 409, "CONFLICT");
  }

  await trip.update({ status: TRIP_STATUS.CANCELLED });
  emitTripEvent(FLEET_EVENTS.TRIP_CANCELLED, { tripId: trip.id, userId: trip.userId });
  return trip;
};

export const assignDriver = async (tripId, userId) => {
  const trip = await ensureTripExists(tripId);
  ensureMutableTrip(trip);

  await validateDriver(userId);

  const { start, end } = normalizeWindow(trip.startTime, trip.endTime);
  await ensureNoDriverOverlap({ userId, start, end, excludeTripId: tripId });

  await trip.update({ userId });

  emitTripEvent(FLEET_EVENTS.TRIP_ASSIGNED, {
    tripId: trip.id,
    userId,
  });

  return trip;
};

export const unassignDriver = async (tripId) => {
  const trip = await ensureTripExists(tripId);
  ensureMutableTrip(trip);

  await trip.update({ userId: null });
  return trip;
};
