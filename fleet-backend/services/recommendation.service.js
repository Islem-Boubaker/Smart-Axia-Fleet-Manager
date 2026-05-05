import { Op } from "sequelize";

import Trip from "../models/trip.model.js";
import User from "../models/user.model.js";
import Vehicle from "../models/vehicle.model.js";
import Maintenance from "../models/maintenance.model.js";
import { eventBus, FLEET_EVENTS } from "../events/eventBus.js";
import { checkVehicleAvailableForTrip } from "./maintenance.service.js";
import {
  buildDriverFeatures,
  buildVehicleFeatures,
  normalizeDriver,
  normalizeVehicle,
} from "./recommendationFeatureBuilder.service.js";
import {
  clampScore,
  predictManyDrivers,
  predictManyVehicles,
} from "./recommendationMLClient.service.js";

const createError = (message, status = 400, code = "BAD_REQUEST") => {
  const error = new Error(message);
  error.status = status;
  error.statusCode = status;
  error.code = code;
  return error;
};

const TRIP_BLOCKED_STATUSES = ["completed", "cancelled"];

const getTripOrThrow = async (tripId) => {
  const trip = await Trip.findByPk(tripId);
  if (!trip) throw createError("Trip not found", 404, "NOT_FOUND");
  if (TRIP_BLOCKED_STATUSES.includes(String(trip.status || "").toLowerCase())) {
    throw createError("Cannot recommend for completed or cancelled trip", 409, "CONFLICT");
  }
  return trip;
};

const buildOverlapWhere = ({ targetField, targetId, start, end, excludeTripId = null }) => {
  const where = {
    [targetField]: targetId,
    status: { [Op.ne]: "cancelled" },
    [Op.and]: [{ startTime: { [Op.lt]: end } }, { [Op.or]: [{ endTime: { [Op.gt]: start } }, { endTime: { [Op.is]: null } }] }],
  };
  if (excludeTripId) where.id = { [Op.ne]: excludeTripId };
  return where;
};

const hasTripOverlap = async ({ targetField, targetId, start, end, excludeTripId }) => {
  const conflict = await Trip.findOne({
    where: buildOverlapWhere({ targetField, targetId, start, end, excludeTripId }),
  });
  return Boolean(conflict);
};

const baseTripContext = (trip) => ({
  id: trip.id,
  region: trip.region || "General",
  distance: Number(trip.distance) || 0,
  requiredCapacity: Number(trip.requiredCapacity) || 0,
  loadType: trip.loadType || "general",
  startTime: trip.startTime,
  endTime: trip.endTime || new Date(new Date(trip.startTime).getTime() + 60 * 60 * 1000),
});

const baseTripContextFromInput = (tripInput) => {
  const startTime = new Date(tripInput.startTime);
  const fallbackEnd = new Date(startTime.getTime() + 60 * 60 * 1000);
  const endTime = tripInput.endTime ? new Date(tripInput.endTime) : fallbackEnd;

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime()) || startTime >= endTime) {
    throw createError("Invalid startTime/endTime for recommendations", 422, "VALIDATION_ERROR");
  }

  return {
    id: null,
    region: tripInput.region || "General",
    distance: Number(tripInput.distance) || 0,
    requiredCapacity: Number(tripInput.requiredCapacity) || 0,
    loadType: tripInput.loadType || "general",
    startTime,
    endTime,
  };
};

const buildDriverReasons = ({ feature, score }) => {
  const reasons = [];
  if (feature.experienceYears >= 5) reasons.push("High experience");
  if (feature.regionMatch === 1) reasons.push("Same region as trip");
  if (feature.successRate >= 0.9 || feature.completedTrips >= 50) {
    reasons.push("Strong completion history");
  }
  if (score < 50) reasons.push("Limited recent performance indicators");
  return reasons;
};

const buildVehicleReasons = ({ feature, score }) => {
  const reasons = [];
  if (feature.capacity >= feature.requiredCapacity) reasons.push("Capacity matches required load");
  if (feature.conditionRating >= 7) reasons.push("Good condition");
  if (feature.maintenanceRisk <= 0.25) reasons.push("No active maintenance conflict");
  if (score < 50) reasons.push("Higher operational risk profile");
  return reasons;
};

const applyDriverAdjustments = (score, candidate, feature) => {
  let finalScore = score;
  if (feature.regionMatch === 1) finalScore += 5;
  if (feature.rating >= 4.5) finalScore += 3;

  const now = Date.now();
  const licenseExpiry = new Date(candidate.licenseExpiryDate || candidate.licenseExpiry || 0).getTime();
  const medicalExpiry = new Date(candidate.medicalCheckExpiryDate || 0).getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  if (licenseExpiry && licenseExpiry - now <= thirtyDaysMs) finalScore -= 10;
  if (medicalExpiry && medicalExpiry - now <= thirtyDaysMs) finalScore -= 10;
  return clampScore(finalScore);
};

const applyVehicleAdjustments = (score, feature) => {
  let finalScore = score;
  const capacityRatio =
    feature.requiredCapacity > 0 ? feature.capacity / feature.requiredCapacity : 1;
  if (capacityRatio >= 1 && capacityRatio <= 1.25) finalScore += 5;
  if (feature.mileage >= 180000) finalScore -= 10;
  if (feature.maintenanceRisk >= 0.7) finalScore -= 15;
  if (feature.conditionRating <= 4) finalScore -= 20;
  return clampScore(finalScore);
};

const rankCandidates = (candidates) =>
  [...candidates]
    .sort((a, b) => b.score - a.score)
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }));

const recommendDriversForContext = async (context, options = {}, excludeTripId = null) => {
  const topN = Math.max(Number(options.topN || 5), 1);

  const drivers = await User.findAll({
    where: {
      role: "DRIVER",
      isActive: true,
      isAvailable: true,
      status: "active",
    },
  });

  const eligible = [];
  for (const driver of drivers) {
    const normalized = normalizeDriver(driver.toJSON());
    if (normalized.role !== "DRIVER") continue;
    if (!normalized.isAvailable || !normalized.isActive) continue;

    const now = new Date();
    if (normalized.licenseExpiryDate && new Date(normalized.licenseExpiryDate) < now) continue;
    if (normalized.medicalCheckExpiryDate && new Date(normalized.medicalCheckExpiryDate) < now) continue;

    const overlap = await hasTripOverlap({
      targetField: "userId",
      targetId: driver.id,
      start: context.startTime,
      end: context.endTime,
      excludeTripId,
    });
    if (overlap) continue;

    eligible.push(driver);
  }

  if (eligible.length === 0) {
    return { trip: context, drivers: [], source: "none" };
  }

  const featureList = eligible.map((driver) =>
    buildDriverFeatures(driver.toJSON(), context)
  );
  const mlResult = await predictManyDrivers(featureList);
  const scoreMap = new Map(mlResult.predictions.map((item) => [String(item.id), item.score]));

  const ranked = rankCandidates(
    eligible.map((driver, index) => {
      const feature = featureList[index];
      const baseScore = scoreMap.get(String(driver.id)) ?? 0;
      const adjustedScore = applyDriverAdjustments(baseScore, driver, feature);
      return {
        driverId: driver.id,
        name: driver.name,
        score: adjustedScore,
        reasons: buildDriverReasons({ feature, score: adjustedScore }),
        source: mlResult.source === "ml" ? "ml_with_adjustments" : "fallback",
      };
    })
  );

  return { trip: context, drivers: ranked.slice(0, topN), source: mlResult.source };
};

const recommendVehiclesForContext = async (context, options = {}, excludeTripId = null) => {
  const topN = Math.max(Number(options.topN || 5), 1);

  const vehicles = await Vehicle.findAll({
    where: {
      status: "AVAILABLE",
      is_active: true,
      isAvailable: true,
    },
  });

  const eligible = [];
  const maintenanceMap = new Map();

  for (const vehicle of vehicles) {
    const normalized = normalizeVehicle(vehicle.toJSON());
    if (!normalized.isAvailable) continue;
    if (["IN_MAINTENANCE", "OUT_OF_SERVICE"].includes(normalized.status)) continue;
    if (normalized.capacity < context.requiredCapacity) continue;

    const overlap = await hasTripOverlap({
      targetField: "vehicleId",
      targetId: vehicle.id,
      start: context.startTime,
      end: context.endTime,
      excludeTripId,
    });
    if (overlap) continue;

    try {
      await checkVehicleAvailableForTrip(vehicle.id, context.startTime, context.endTime);
    } catch {
      continue;
    }

    const maintenances = await Maintenance.findAll({
      where: {
        vehicleId: vehicle.id,
        status: { [Op.in]: ["scheduled", "pending", "in progress", "in_progress", "completed"] },
      },
      order: [["scheduledDate", "DESC"]],
      limit: 5,
    });
    maintenanceMap.set(String(vehicle.id), maintenances.map((m) => m.toJSON()));
    eligible.push(vehicle);
  }

  if (eligible.length === 0) {
    return { trip: context, vehicles: [], source: "none" };
  }

  const featureList = eligible.map((vehicle) =>
    buildVehicleFeatures(vehicle.toJSON(), context, maintenanceMap.get(String(vehicle.id)) || [])
  );
  const mlResult = await predictManyVehicles(featureList);
  const scoreMap = new Map(mlResult.predictions.map((item) => [String(item.id), item.score]));

  const ranked = rankCandidates(
    eligible.map((vehicle, index) => {
      const feature = featureList[index];
      const baseScore = scoreMap.get(String(vehicle.id)) ?? 0;
      const adjustedScore = applyVehicleAdjustments(baseScore, feature);
      return {
        vehicleId: vehicle.id,
        name: vehicle.name,
        score: adjustedScore,
        reasons: buildVehicleReasons({ feature, score: adjustedScore }),
        source: mlResult.source === "ml" ? "ml_with_adjustments" : "fallback",
      };
    })
  );

  return { trip: context, vehicles: ranked.slice(0, topN), source: mlResult.source };
};

export const recommendDriversForTrip = async (tripId, options = {}) => {
  const trip = await getTripOrThrow(tripId);
  const context = baseTripContext(trip);
  return recommendDriversForContext(context, options, trip.id);
};

export const recommendVehiclesForTrip = async (tripId, options = {}) => {
  const trip = await getTripOrThrow(tripId);
  const context = baseTripContext(trip);
  return recommendVehiclesForContext(context, options, trip.id);
};

export const recommendDriversForTripInput = async (tripInput, options = {}) => {
  const context = baseTripContextFromInput(tripInput);
  return recommendDriversForContext(context, options, null);
};

export const recommendVehiclesForTripInput = async (tripInput, options = {}) => {
  const context = baseTripContextFromInput(tripInput);
  return recommendVehiclesForContext(context, options, null);
};

export const recommendBestAssignmentForTrip = async (tripId, options = {}) => {
  const trip = await getTripOrThrow(tripId);
  const context = baseTripContext(trip);
  const [driverResult, vehicleResult] = await Promise.all([
    recommendDriversForContext(context, options, trip.id),
    recommendVehiclesForContext(context, options, trip.id),
  ]);
  return {
    trip: driverResult.trip,
    bestDriver: driverResult.drivers[0] || null,
    bestVehicle: vehicleResult.vehicles[0] || null,
    drivers: driverResult.drivers,
    vehicles: vehicleResult.vehicles,
    source: {
      driver: driverResult.source,
      vehicle: vehicleResult.source,
    },
  };
};

export const recommendBestAssignmentForTripInput = async (tripInput, options = {}) => {
  const context = baseTripContextFromInput(tripInput);
  const [driverResult, vehicleResult] = await Promise.all([
    recommendDriversForContext(context, options, null),
    recommendVehiclesForContext(context, options, null),
  ]);
  return {
    trip: context,
    bestDriver: driverResult.drivers[0] || null,
    bestVehicle: vehicleResult.vehicles[0] || null,
    drivers: driverResult.drivers,
    vehicles: vehicleResult.vehicles,
    source: {
      driver: driverResult.source,
      vehicle: vehicleResult.source,
    },
  };
};

export const assignRecommendedDriverAndVehicle = async (tripId, options = {}) => {
  const recommendation = await recommendBestAssignmentForTrip(tripId, options);
  if (!recommendation.bestVehicle) {
    throw createError("No available vehicles for assignment", 409, "NO_VEHICLES_AVAILABLE");
  }

  const trip = await getTripOrThrow(tripId);
  const updatePayload = {
    vehicleId: recommendation.bestVehicle.vehicleId,
  };
  if (recommendation.bestDriver?.driverId) {
    updatePayload.userId = recommendation.bestDriver.driverId;
    await User.update(
      { lastAssignedAt: new Date() },
      { where: { id: recommendation.bestDriver.driverId } }
    );
  }

  await trip.update(updatePayload);

  if (updatePayload.userId) {
    eventBus.emitEvent(FLEET_EVENTS.TRIP_ASSIGNED, {
      tripId: trip.id,
      userId: updatePayload.userId,
    });
  }

  return {
    recommendation,
    trip,
  };
};

