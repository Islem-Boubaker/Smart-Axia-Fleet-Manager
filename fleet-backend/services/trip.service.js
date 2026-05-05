import { Op } from "sequelize";
import axios from "axios";

import { sequelize } from "../config/connectdb.js";
import { getPagingData } from "../utils/pagination.js";
import Trip from "../models/trip.model.js";
import TripStop from "../models/TripStop.js";
import TripLocationPing from "../models/tripLocationPing.model.js";
import User from "../models/user.model.js";
import Vehicle from "../models/vehicle.model.js";
import { checkVehicleAvailableForTrip } from "./maintenance.service.js";
import {
  recordRouteDeviationScoreEvent,
  removeTripCompletionScoreEvent,
  syncTripCompletionScoreEvent,
} from "./driverScore.service.js";
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

const ROUTE_DEVIATION_THRESHOLD_METERS = 500;
const ROUTE_DEVIATION_EVENT_COOLDOWN_MS = 2 * 60 * 1000;
const METERS_PER_DEGREE_LATITUDE = 111_320;
const routeDeviationEventTimestamps = new Map();

const createError = (message, status = 400, code = "BAD_REQUEST") => {
  const error = new Error(message);
  error.status = status;
  error.statusCode = status;
  error.code = code;
  return error;
};

const tripRelationInclude = [
  { model: User, as: "driver", attributes: ["id", "name"] },
  { model: Vehicle, as: "vehicle", attributes: ["id", "name", "plaque_immatriculation", "consumption"] },
];

const ensureTripExists = async (tripId, includeStops = false) => {
  const trip = await Trip.findByPk(tripId, {
    include: includeStops
      ? [{ model: TripStop, as: "stops" }, ...tripRelationInclude]
      : [...tripRelationInclude],
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

const resolvePlannedEndTime = (data = {}, fallback = null) =>
  data.plannedEndTime ?? data.endTime ?? fallback ?? null;

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

const syncVehicleStatusForTripStatus = async (trip, tripStatus) => {
  if (!trip?.vehicleId) return;

  const vehicle = await Vehicle.findByPk(trip.vehicleId);
  if (!vehicle) return;

  if (tripStatus === TRIP_STATUS.ONGOING) {
    await vehicle.update({ status: "ON_TRIP", is_active: true });
    return;
  }

  if (
    [TRIP_STATUS.COMPLETED, TRIP_STATUS.CANCELLED].includes(tripStatus) &&
    vehicle.status === "ON_TRIP"
  ) {
    await vehicle.update({ status: "AVAILABLE", is_active: true });
  }
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

const toFiniteNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toRequiredCoordinate = (value, label, min, max) => {
  const parsed = toFiniteNumberOrNull(value);
  if (parsed === null || parsed < min || parsed > max) {
    throw createError(`${label} must be a valid coordinate`, 422, "VALIDATION_ERROR");
  }
  return parsed;
};

const toOptionalNumber = (value) => toFiniteNumberOrNull(value);

const normalizeRecordedAt = (value) => {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const getPositiveEnvNumber = (key, fallback) => {
  const parsed = Number(process.env[key]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getRouteDeviationThresholdMeters = () =>
  getPositiveEnvNumber("ROUTE_DEVIATION_THRESHOLD_METERS", ROUTE_DEVIATION_THRESHOLD_METERS);

const getRouteDeviationCooldownMs = () =>
  getPositiveEnvNumber("ROUTE_DEVIATION_EVENT_COOLDOWN_MS", ROUTE_DEVIATION_EVENT_COOLDOWN_MS);

const emitTripEvent = (event, payload) => {
  try {
    eventBus.emitEvent(event, payload);
  } catch (error) {
    console.error(`[EventBus] Failed to emit ${event}:`, error.message);
  }
};

const toCoordinatePoint = (latitude, longitude) => {
  const parsedLatitude = toFiniteNumberOrNull(latitude);
  const parsedLongitude = toFiniteNumberOrNull(longitude);

  if (
    parsedLatitude === null ||
    parsedLongitude === null ||
    parsedLatitude < -90 ||
    parsedLatitude > 90 ||
    parsedLongitude < -180 ||
    parsedLongitude > 180
  ) {
    return null;
  }

  return {
    latitude: parsedLatitude,
    longitude: parsedLongitude,
  };
};

const getTripRouteCoordinates = (trip) => {
  const coordinates = [];
  const addPoint = (latitude, longitude) => {
    const point = toCoordinatePoint(latitude, longitude);
    if (point) coordinates.push(point);
  };

  addPoint(trip.startLatitude, trip.startLongitude);

  const stops = Array.isArray(trip.stops)
    ? [...trip.stops].sort((a, b) => Number(a.stopOrder ?? 0) - Number(b.stopOrder ?? 0))
    : [];

  for (const stop of stops) {
    addPoint(stop.latitude, stop.longitude);
  }

  addPoint(trip.endLatitude, trip.endLongitude);
  return coordinates;
};

const projectToMeters = (point, referenceLatitude) => {
  const metersPerDegreeLongitude =
    METERS_PER_DEGREE_LATITUDE * Math.cos((referenceLatitude * Math.PI) / 180);

  return {
    x: point.longitude * metersPerDegreeLongitude,
    y: point.latitude * METERS_PER_DEGREE_LATITUDE,
  };
};

const getPointToSegmentDistanceMeters = (point, segmentStart, segmentEnd) => {
  const dx = segmentEnd.x - segmentStart.x;
  const dy = segmentEnd.y - segmentStart.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - segmentStart.x, point.y - segmentStart.y);
  }

  const rawT =
    ((point.x - segmentStart.x) * dx + (point.y - segmentStart.y) * dy) / (dx * dx + dy * dy);
  const t = Math.max(0, Math.min(1, rawT));
  const closest = {
    x: segmentStart.x + t * dx,
    y: segmentStart.y + t * dy,
  };

  return Math.hypot(point.x - closest.x, point.y - closest.y);
};

const getDistanceFromRouteMeters = (point, routeCoordinates) => {
  if (!point || !Array.isArray(routeCoordinates) || routeCoordinates.length < 2) {
    return null;
  }

  const referenceLatitude =
    [...routeCoordinates, point].reduce((sum, item) => sum + item.latitude, 0) /
    (routeCoordinates.length + 1);
  const projectedPoint = projectToMeters(point, referenceLatitude);
  const projectedRoute = routeCoordinates.map((coordinate) =>
    projectToMeters(coordinate, referenceLatitude)
  );

  let closestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < projectedRoute.length - 1; index += 1) {
    closestDistance = Math.min(
      closestDistance,
      getPointToSegmentDistanceMeters(
        projectedPoint,
        projectedRoute[index],
        projectedRoute[index + 1]
      )
    );
  }

  return Number.isFinite(closestDistance) ? closestDistance : null;
};

const shouldEmitRouteDeviationEvent = (tripId) => {
  const now = Date.now();
  const cooldownMs = getRouteDeviationCooldownMs();
  const lastEmittedAt = routeDeviationEventTimestamps.get(String(tripId));

  if (lastEmittedAt && now - lastEmittedAt < cooldownMs) {
    return false;
  }

  routeDeviationEventTimestamps.set(String(tripId), now);

  if (routeDeviationEventTimestamps.size > 500) {
    for (const [trackedTripId, timestamp] of routeDeviationEventTimestamps.entries()) {
      if (now - timestamp > cooldownMs) {
        routeDeviationEventTimestamps.delete(trackedTripId);
      }
    }
  }

  return true;
};

const maybeEmitRouteDeviation = ({ trip, latitude, longitude, accuracy, speed, heading, recordedAt }) => {
  const routeCoordinates = getTripRouteCoordinates(trip);
  const currentPoint = toCoordinatePoint(latitude, longitude);
  const distanceMeters = getDistanceFromRouteMeters(currentPoint, routeCoordinates);
  const thresholdMeters = getRouteDeviationThresholdMeters();

  if (distanceMeters === null || distanceMeters <= thresholdMeters) return null;

  // A very inaccurate phone fix can look like a route deviation; skip noisy points.
  if (accuracy !== null && accuracy > thresholdMeters) return null;

  if (!shouldEmitRouteDeviationEvent(trip.id)) {
    return {
      distanceMeters,
      thresholdMeters,
      emitted: false,
    };
  }

  emitTripEvent(FLEET_EVENTS.AI_ROUTE_DEVIATION, {
    tripId: trip.id,
    driverId: trip.userId,
    driverName: trip.driver?.name ?? null,
    vehicleId: trip.vehicleId,
    vehicleName: trip.vehicle?.name ?? null,
    vehiclePlate: trip.vehicle?.plaque_immatriculation ?? null,
    startLocation: trip.startLocation,
    endLocation: trip.endLocation,
    latitude,
    longitude,
    accuracy,
    speed,
    heading,
    recordedAt,
    distanceMeters: Math.round(distanceMeters),
    thresholdMeters,
  });

  return {
    distanceMeters,
    thresholdMeters,
    emitted: true,
  };
};

const enrichTripWithEstimatedFuel = (trip) => {
  if (!trip) return trip;

  const currentFuel = toFiniteNumberOrNull(trip.fuel);
  if (currentFuel !== null) return trip;

  const distance = toFiniteNumberOrNull(trip.distance);
  const consumption = toFiniteNumberOrNull(trip.vehicle?.consumption);

  if (distance === null || consumption === null || distance <= 0 || consumption <= 0) {
    return trip;
  }

  const estimatedFuel = Number(((distance * consumption) / 100).toFixed(2));
  trip.setDataValue("fuel", estimatedFuel);
  return trip;
};

const fetchTripWithStops = async (tripId) => {
  const trip = await Trip.findByPk(tripId, {
    include: [{ model: TripStop, as: "stops" }, ...tripRelationInclude],
    order: [[{ model: TripStop, as: "stops" }, "stopOrder", "ASC"]],
  });

  return enrichTripWithEstimatedFuel(trip);
};
/**
 * Fetches available drivers and vehicles, then ranks them using the Python ML service.
 */
export const getTripRecommendations = async (tripData) => {
  const { startTime, endTime, region, requiredCapacity, distance } = tripData;
  const { start, end } = normalizeWindow(startTime, endTime);

  // 1. Get potential candidates
  const drivers = await User.findAll({ where: { role: 'DRIVER', isActive: true, status: 'active' } });
  const vehicles = await Vehicle.findAll({ where: { status: 'AVAILABLE', is_active: true } });

  // 2. Filter by availability (concurrency-safe checks)
  const availableDrivers = [];
  for (const d of drivers) {
    try {
      await ensureNoDriverOverlap({ userId: d.id, start, end });
      availableDrivers.push(d);
    } catch { /* skip */ }
  }

  const availableVehicles = [];
  for (const v of vehicles) {
    try {
      await ensureNoVehicleOverlap({ vehicleId: v.id, start, end });
      await checkVehicleAvailableForTrip(v.id, start, end);
      availableVehicles.push(v);
    } catch { /* skip */ }
  }

  if (availableDrivers.length === 0 && availableVehicles.length === 0) {
    return { drivers: [], vehicles: [] };
  }

  // 3. Call ML Service
  const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
  const tripInfo = { 
    region: region || "General", 
    requiredCapacity: toFiniteNumberOrNull(requiredCapacity) || 0, 
    distance: toFiniteNumberOrNull(distance) || 0 
  };

  try {
    const [driverRes, vehicleRes] = await Promise.all([
      availableDrivers.length > 0 
        ? axios.post(`${mlUrl}/batch-predict-drivers`, {
            drivers: availableDrivers.map(d => ({
              id: d.id,
              yearsOfExperience: d.yearsOfExperience,
              rating: d.rating,
              completedTrips: d.completedTrips,
              totalTrips: d.totalTrips,
              familiarRegions: d.familiarRegions || []
            })),
            trip: tripInfo
          })
        : { data: { predictions: [] } },
      availableVehicles.length > 0
        ? axios.post(`${mlUrl}/batch-predict-vehicles`, {
            vehicles: availableVehicles.map(v => ({
              id: v.id,
              capacity: v.capacity,
              conditionRating: v.conditionRating,
              fuelEfficiency: v.fuelEfficiencyCategory,
              mileage: v.mileage
            })),
            trip: tripInfo
          })
        : { data: { predictions: [] } }
    ]);

    // 4. Sort results
    const rankedDrivers = availableDrivers.map(d => {
      const p = driverRes.data.predictions?.find(x => x.driver_id === d.id);
      return { ...d.toJSON(), ml_score: p ? p.predicted_score : 0 };
    }).sort((a, b) => b.ml_score - a.ml_score);

    const rankedVehicles = availableVehicles.map(v => {
      const p = vehicleRes.data.predictions?.find(x => x.vehicle_id === v.id);
      return { ...v.toJSON(), ml_score: p ? p.predicted_score : 0 };
    }).sort((a, b) => b.ml_score - a.ml_score);

    return { drivers: rankedDrivers, vehicles: rankedVehicles };
  } catch (err) {
    console.error('[ML Service] Recommendation failed:', err.message);
    // Fallback to basic lists if ML is down
    return { drivers: availableDrivers, vehicles: availableVehicles };
  }
};

export const createTrip = async (data) => {
  const plannedEndTime = resolvePlannedEndTime(data);
  const { start, end } = normalizeWindow(data.startTime, plannedEndTime);

  // ── ML Recommendation Logic ──────────────────────────────────────────
  // If driver or vehicle is missing, auto-pick the best available recommendation
  if (!data.vehicleId || !data.userId) {
    console.log('[TripService] Missing assignments, fetching recommendations...');
    const recs = await getTripRecommendations(data);
    
    if (!data.vehicleId && recs.vehicles.length > 0) {
      data.vehicleId = recs.vehicles[0].id;
      console.log(`[TripService] Auto-assigned vehicle: ${data.vehicleId}`);
    }
    
    if (!data.userId && recs.drivers.length > 0) {
      data.userId = recs.drivers[0].id;
      console.log(`[TripService] Auto-assigned driver: ${data.userId}`);
    }
    
    if (!data.vehicleId) {
       throw createError("No available vehicles found for this time slot", 409, "NO_VEHICLES_AVAILABLE");
    }
  }

  const vehicle = await validateVehicle(data.vehicleId);

  await checkVehicleAvailableForTrip(data.vehicleId, start, end);
  if (data.userId) {
    await validateDriver(data.userId);
  }

  await ensureNoVehicleOverlap({ vehicleId: data.vehicleId, start, end });
  await ensureNoDriverOverlap({ userId: data.userId, start, end });

  const distance = toFiniteNumberOrNull(data.distance);
  const explicitFuel = toFiniteNumberOrNull(data.fuel);
  const consumption = toFiniteNumberOrNull(vehicle?.consumption);
  const estimatedFuel =
    explicitFuel !== null
      ? explicitFuel
      : distance !== null && consumption !== null && distance > 0 && consumption > 0
        ? (distance * consumption) / 100
        : null;

  const result = await sequelize.transaction(async (transaction) => {
    const { stops = [], ...tripInput } = data;

    const trip = await Trip.create(
      {
        ...tripInput,
        plannedEndTime,
        endTime: plannedEndTime,
        fuel: estimatedFuel,
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

export const getTrips = async (filters = {}, pagination = {}, callerRole, callerId, cacheKey = null) => {
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
    include: [...tripRelationInclude],
  };

  if (includeStops) {
    query.include = [{ model: TripStop, as: "stops" }, ...tripRelationInclude];
    query.distinct = true;
  }

  const { count, rows } = await Trip.findAndCountAll(query);

  if (includeStops) {
    for (const trip of rows) {
      enrichTripWithEstimatedFuel(trip);
      if (Array.isArray(trip.stops)) {
        trip.stops.sort((a, b) => a.stopOrder - b.stopOrder);
      }
    }
  } else {
    for (const trip of rows) {
      enrichTripWithEstimatedFuel(trip);
    }
  }

  return getPagingData(count, rows, page, limit);
};

export const getTripById = async (tripId, callerRole, callerId, cacheKey = null) => {
  const trip = await ensureTripExists(tripId, true);
  ensureDriverOwnership(trip, callerRole, callerId);
  enrichTripWithEstimatedFuel(trip);

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
  const nextPlannedEnd = resolvePlannedEndTime(data, trip.plannedEndTime ?? trip.endTime);

  const { start, end } = normalizeWindow(nextStart, nextPlannedEnd);

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

  const updatePayload = { ...data };
  if (Object.prototype.hasOwnProperty.call(data, "endTime") || Object.prototype.hasOwnProperty.call(data, "plannedEndTime")) {
    updatePayload.plannedEndTime = nextPlannedEnd;
    updatePayload.endTime = nextPlannedEnd;
  }

  await trip.update(updatePayload);
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

  if (newStatus === TRIP_STATUS.ONGOING) {
    await validateVehicle(trip.vehicleId);
  }

  const updatePayload = { status: newStatus };
  if (newStatus === TRIP_STATUS.COMPLETED) {
    updatePayload.endTime = new Date().toISOString();
    if (!trip.plannedEndTime && trip.endTime) {
      updatePayload.plannedEndTime = trip.endTime;
    }
  }

  await trip.update(updatePayload);
  await syncVehicleStatusForTripStatus(trip, newStatus);

  if (newStatus === TRIP_STATUS.ONGOING) {
    emitTripEvent(FLEET_EVENTS.TRIP_STARTED, { tripId: trip.id, userId: trip.userId });
  }
  if (newStatus === TRIP_STATUS.COMPLETED) {
    emitTripEvent(FLEET_EVENTS.TRIP_COMPLETED, { tripId: trip.id, userId: trip.userId });
    await syncTripCompletionScoreEvent(trip.id);
  }
  if (newStatus === TRIP_STATUS.CANCELLED) {
    emitTripEvent(FLEET_EVENTS.TRIP_CANCELLED, { tripId: trip.id, userId: trip.userId });
    await removeTripCompletionScoreEvent(trip.id);
  }

  return trip;
};

export const startTrip = async (tripId, callerRole, callerId) => {
  const trip = await ensureTripExists(tripId);
  ensureDriverOwnership(trip, callerRole, callerId);

  if (trip.status !== TRIP_STATUS.SCHEDULED) {
    throw createError("Trip can only be started from scheduled status", 409, "CONFLICT");
  }

  await validateVehicle(trip.vehicleId);

  await trip.update({ status: TRIP_STATUS.ONGOING });
  await syncVehicleStatusForTripStatus(trip, TRIP_STATUS.ONGOING);
  emitTripEvent(FLEET_EVENTS.TRIP_STARTED, { tripId: trip.id, userId: trip.userId });
  return trip;
};

export const completeTrip = async (tripId, callerRole, callerId, settlement = {}) => {
  const trip = await ensureTripExists(tripId);
  ensureDriverOwnership(trip, callerRole, callerId);

  if (trip.status !== TRIP_STATUS.ONGOING) {
    throw createError("Trip can only be completed from ongoing status", 409, "CONFLICT");
  }

  const updates = {
    status: TRIP_STATUS.COMPLETED,
    endTime: settlement.endTime || new Date().toISOString(),
  };
  if (!trip.plannedEndTime && trip.endTime) {
    updates.plannedEndTime = trip.endTime;
  }
  if (settlement.revenue !== undefined) updates.revenue = settlement.revenue;
  if (settlement.fuel !== undefined) updates.fuel = settlement.fuel;

  await trip.update(updates);
  await syncVehicleStatusForTripStatus(trip, TRIP_STATUS.COMPLETED);
  emitTripEvent(FLEET_EVENTS.TRIP_COMPLETED, { tripId: trip.id, userId: trip.userId });
  await syncTripCompletionScoreEvent(trip.id);
  return trip;
};

export const cancelTrip = async (tripId, callerRole, callerId) => {
  const trip = await ensureTripExists(tripId);
  ensureDriverOwnership(trip, callerRole, callerId);

  if (![TRIP_STATUS.SCHEDULED, TRIP_STATUS.ONGOING].includes(trip.status)) {
    throw createError("Trip can only be cancelled from scheduled or ongoing", 409, "CONFLICT");
  }

  await trip.update({ status: TRIP_STATUS.CANCELLED });
  await syncVehicleStatusForTripStatus(trip, TRIP_STATUS.CANCELLED);
  emitTripEvent(FLEET_EVENTS.TRIP_CANCELLED, { tripId: trip.id, userId: trip.userId });
  await removeTripCompletionScoreEvent(trip.id);
  return trip;
};

export const assignDriver = async (tripId, userId) => {
  const trip = await ensureTripExists(tripId);
  ensureMutableTrip(trip);

  await validateDriver(userId);

  const { start, end } = normalizeWindow(trip.startTime, trip.plannedEndTime ?? trip.endTime);
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

export const recordTripLocationPing = async (tripId, callerRole, callerId, payload = {}) => {
  const trip = await ensureTripExists(tripId, true);
  ensureDriverOwnership(trip, callerRole, callerId);

  if (trip.status !== TRIP_STATUS.ONGOING) {
    throw createError("Location tracking is only available for ongoing trips", 409, "CONFLICT");
  }

  const latitude = toRequiredCoordinate(payload.latitude, "latitude", -90, 90);
  const longitude = toRequiredCoordinate(payload.longitude, "longitude", -180, 180);
  const accuracy = toOptionalNumber(payload.accuracy);
  const speed = toOptionalNumber(payload.speed);
  const heading = toOptionalNumber(payload.heading);
  const recordedAt = normalizeRecordedAt(payload.timestamp ?? payload.recordedAt);

  const ping = await TripLocationPing.create({
    tripId: trip.id,
    userId: callerId,
    latitude,
    longitude,
    accuracy,
    speed,
    heading,
    recordedAt,
  });

  const deviation = maybeEmitRouteDeviation({ trip, latitude, longitude, accuracy, speed, heading, recordedAt });
  if (deviation?.distanceMeters && trip.userId) {
    await recordRouteDeviationScoreEvent({
      tripId: trip.id,
      driverId: trip.userId,
      distanceMeters: Math.round(deviation.distanceMeters),
      recordedAt,
    });
  }

  return ping;
};

export const getTripLiveLocation = async (tripId, callerRole, callerId) => {
  const trip = await ensureTripExists(tripId);
  ensureDriverOwnership(trip, callerRole, callerId);

  const latestPing = await TripLocationPing.findOne({
    where: { tripId: trip.id },
    include: [{ model: User, as: "driver", attributes: ["id", "name", "email"] }],
    order: [["recordedAt", "DESC"], ["createdAt", "DESC"]],
  });

  if (!latestPing) return null;

  const recordedAt = latestPing.recordedAt || latestPing.createdAt;
  const ageMs = recordedAt ? Date.now() - new Date(recordedAt).getTime() : null;

  return {
    id: latestPing.id,
    tripId: latestPing.tripId,
    userId: latestPing.userId,
    driver: latestPing.driver
      ? {
          id: latestPing.driver.id,
          name: latestPing.driver.name,
          email: latestPing.driver.email,
        }
      : null,
    latitude: latestPing.latitude,
    longitude: latestPing.longitude,
    accuracy: latestPing.accuracy,
    speed: latestPing.speed,
    heading: latestPing.heading,
    recordedAt,
    isStale: typeof ageMs === "number" ? ageMs > 2 * 60 * 1000 : true,
  };
};



