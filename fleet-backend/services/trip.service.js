import Trip  from '../models/trip.model.js'; 
import  Vehicle  from '../models/vehicle.model.js';
import  User  from '../models/user.model.js';

class ApiError extends Error {
  constructor(statusCode, message, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

const parseDate = (s) => new Date(s);

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

export const createTrip = async (payload, currentUser) => {
  const start = parseDate(payload.startTime);
  const end = parseDate(payload.endTime);
  if (!(start < end)) throw new ApiError(422, 'startTime must be before endTime', 'VALIDATION_ERROR');

  const vehicle = await Vehicle.findByPk(payload.vehicleId);
  if (!vehicle) throw new ApiError(404, 'Vehicle not found', 'NOT_FOUND');

  
  if (vehicle.status === 'IN_MAINTENANCE' || vehicle.status === 'OUT_OF_SERVICE') {
    throw new ApiError(409, 'Vehicle is not available', 'CONFLICT');
  }

  const driver = await User.findByPk(payload.driverId);
  if (!driver) throw new ApiError(404, 'Driver not found', 'NOT_FOUND');
  if (driver.role && driver.role !== 'DRIVER') {
    // optionnel si tu imposes role DRIVER
  }

  // conflict: vehicle
  const vehicleTrips = await Trip.findAll({ where: { vehicleId: payload.vehicleId } });
  for (const t of vehicleTrips) {
    const tStart = parseDate(t.startTime);
    const tEnd = parseDate(t.endTime);
    if (overlaps(start, end, tStart, tEnd) && !['CANCELLED'].includes(t.status)) {
      throw new ApiError(409, 'Vehicle has a conflicting trip', 'CONFLICT');
    }
  }

  // conflict: driver
  const driverTrips = await Trip.findAll({ where: { driverId: payload.driverId } });
  for (const t of driverTrips) {
    const tStart = parseDate(t.startTime);
    const tEnd = parseDate(t.endTime);
    if (overlaps(start, end, tStart, tEnd) && !['CANCELLED'].includes(t.status)) {
      throw new ApiError(409, 'Driver has a conflicting trip', 'CONFLICT');
    }
  }

  const trip = await Trip.create({
    ...payload,
    status: 'PLANNED',
    createdBy: currentUser.id, 
  });

  return trip;
};

export const listTrips = async (query, currentUser) => {

  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '20', 10), 1), 100);
  const offset = (page - 1) * limit;

  const where = {};
  if (query.status) where.status = query.status;
  if (query.vehicleId) where.vehicleId = query.vehicleId;
  if (query.driverId) where.driverId = query.driverId;

  if (currentUser.role === 'DRIVER') {
    where.driverId = currentUser.id;
  }

  
  const { rows, count } = await Trip.findAndCountAll({ where, limit, offset, order: [['startTime', 'DESC']] });

  return {
    data: rows,
    meta: { page, limit, total: count },
  };
};

export const getTripById = async (id, currentUser) => {
  const trip = await Trip.findByPk(id);
  if (!trip) throw new ApiError(404, 'Trip not found', 'NOT_FOUND');

  if (currentUser.role === 'DRIVER' && trip.driverId !== currentUser.id) {
    throw new ApiError(403, 'Forbidden', 'FORBIDDEN');
  }

  return trip;
};

export const updateTrip = async (id, payload, currentUser) => {
  const trip = await Trip.findByPk(id);
  if (!trip) throw new ApiError(404, 'Trip not found', 'NOT_FOUND');

 
  if (trip.status === 'COMPLETED') {
    throw new ApiError(409, 'Cannot update a completed trip', 'CONFLICT');
  }

  const newStart = payload.startTime ? parseDate(payload.startTime) : parseDate(trip.startTime);
  const newEnd = payload.endTime ? parseDate(payload.endTime) : parseDate(trip.endTime);
  if (!(newStart < newEnd)) throw new ApiError(422, 'startTime must be before endTime', 'VALIDATION_ERROR');

  await trip.update(payload);
  return trip;
};

export const updateTripStatus = async (id, status) => {
  const trip = await Trip.findByPk(id);
  if (!trip) throw new ApiError(404, 'Trip not found', 'NOT_FOUND');

  await trip.update({ status });
  return trip;
};

export const deleteTrip = async (id) => {
  const trip = await Trip.findByPk(id);
  if (!trip) throw new ApiError(404, 'Trip not found', 'NOT_FOUND');
  await trip.destroy();
};