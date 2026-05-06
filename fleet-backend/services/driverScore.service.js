import { Op } from "sequelize";
import DriverScoreEvent from "../models/driverScoreEvent.model.js";
import Reclamation from "../models/reclamation.model.js";
import Trip from "../models/trip.model.js";
import User from "../models/user.model.js";

const SCORE_BASELINE = 100;
const SCORE_MIN = 0;
const SCORE_MAX = 100;
const LATE_TRIP_INTERVAL_MINUTES = 15;
const LATE_TRIP_POINTS_PER_INTERVAL = -2;
const ON_TIME_TRIP_BONUS = 2;
const ROUTE_DEVIATION_PENALTY = -3;
const ACCIDENT_PENALTY = -10;

const EXPERIENCE_BADGES = [
  { minTrips: 100, key: "elite_driver", label: "Elite Driver" },
  { minTrips: 50, key: "pro_driver", label: "Pro Driver" },
  { minTrips: 25, key: "experienced", label: "Experienced" },
  { minTrips: 10, key: "road_ready", label: "Road Ready" },
  { minTrips: 0, key: "rookie", label: "Rookie" },
];

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const clampScore = (value) => Math.max(SCORE_MIN, Math.min(SCORE_MAX, value));

const isAccidentType = (type) => {
  const normalized = String(type || "")
    .trim()
    .toLowerCase();
  return normalized === "accident" || normalized === "damage";
};

const buildScoreReason = ({ eventType, delta, delayMinutes, tripReference, vehicleLabel }) => {
  if (eventType === "ACCIDENT_RECLAMATION") {
    return `Accident issue submitted${vehicleLabel ? ` for ${vehicleLabel}` : ""}`;
  }

  if (eventType === "ROUTE_DEVIATION") {
    return `Route deviation detected${tripReference ? ` on trip ${tripReference}` : ""}`;
  }

  if (eventType === "TRIP_COMPLETION" && delta >= 0) {
    return `Trip completed on time${tripReference ? ` (${tripReference})` : ""}`;
  }

  if (eventType === "TRIP_COMPLETION") {
    return `Trip completed ${delayMinutes} min late${tripReference ? ` (${tripReference})` : ""}`;
  }

  return "Driver score updated";
};

const buildTripReference = (trip) => {
  if (!trip) return null;
  const start = String(trip.startLocation || "").trim();
  const end = String(trip.endLocation || "").trim();
  if (start && end) return `${start} -> ${end}`;
  return trip.id || null;
};

const buildVehicleLabel = (reclamation) => {
  if (!reclamation) return null;
  if (reclamation.vehicleName && reclamation.vehiclePlate) {
    return `${reclamation.vehicleName} (${reclamation.vehiclePlate})`;
  }
  return reclamation.vehicleName || reclamation.vehiclePlate || null;
};

const calculateTripCompletionScore = (trip) => {
  const actualEnd = toDate(trip?.endTime);
  const plannedEnd = toDate(trip?.plannedEndTime);

  if (!actualEnd || !plannedEnd) {
    return {
      pointsDelta: 0,
      delayMinutes: 0,
      onTime: false,
    };
  }

  const rawDelayMinutes = Math.ceil((actualEnd.getTime() - plannedEnd.getTime()) / 60000);
  if (rawDelayMinutes <= 0) {
    return {
      pointsDelta: ON_TIME_TRIP_BONUS,
      delayMinutes: 0,
      onTime: true,
    };
  }

  const lateIntervals = Math.ceil(rawDelayMinutes / LATE_TRIP_INTERVAL_MINUTES);
  return {
    pointsDelta: lateIntervals * LATE_TRIP_POINTS_PER_INTERVAL,
    delayMinutes: rawDelayMinutes,
    onTime: false,
  };
};

const getCompletedTripsCountMap = async (driverIds) => {
  if (!driverIds.length) return new Map();

  const trips = await Trip.findAll({
    attributes: ["userId"],
    where: {
      userId: { [Op.in]: driverIds },
      status: "completed",
    },
    raw: true,
  });

  const counts = new Map();
  for (const trip of trips) {
    const key = String(trip.userId);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
};

const getLatestTripCompletionEvent = async (tripId) =>
  DriverScoreEvent.findOne({
    where: {
      tripId,
      eventType: "TRIP_COMPLETION",
    },
  });

const upsertEvent = async ({ sourceKey, defaults, mutableFields = [] }) => {
  const existing = await DriverScoreEvent.findOne({ where: { sourceKey } });
  if (!existing) {
    return DriverScoreEvent.create({ sourceKey, ...defaults });
  }

  const patch = {};
  for (const field of mutableFields) {
    if (Object.prototype.hasOwnProperty.call(defaults, field)) {
      patch[field] = defaults[field];
    }
  }

  if (Object.keys(patch).length > 0) {
    await existing.update(patch);
  }

  return existing;
};

export const getDriverExperienceBadge = (completedTrips = 0) => {
  const safeTrips = Math.max(Number(completedTrips) || 0, 0);
  return EXPERIENCE_BADGES.find((badge) => safeTrips >= badge.minTrips) || EXPERIENCE_BADGES.at(-1);
};

export const recomputeDriverScoreSummary = async (driverId) => {
  const [driver, events, completedTrips] = await Promise.all([
    User.findByPk(driverId, {
      attributes: ["id", "name", "email", "avatar", "role"],
    }),
    DriverScoreEvent.findAll({
      where: { driverId },
      order: [["occurredAt", "ASC"], ["createdAt", "ASC"]],
      raw: true,
    }),
    Trip.count({
      where: {
        userId: driverId,
        status: "completed",
      },
    }),
  ]);

  if (!driver || driver.role !== "DRIVER") {
    return null;
  }

  let score = SCORE_BASELINE;
  const history = [];

  for (const event of events) {
    score = clampScore(score + Number(event.pointsDelta || 0));
    history.push({
      id: event.id,
      eventType: event.eventType,
      pointsDelta: Number(event.pointsDelta || 0),
      scoreAfter: score,
      occurredAt: event.occurredAt,
      reason: event.reason,
      metadata: event.metadata || {},
    });
  }

  const currentScore = clampScore(score);
  const badge = getDriverExperienceBadge(completedTrips);
  const recentEvents = history.slice(-5).reverse();
  const trend = history.slice(-8);

  return {
    driver: {
      id: driver.id,
      name: driver.name,
      email: driver.email,
      avatar: driver.avatar,
    },
    score: currentScore,
    completedTrips,
    badge,
    eventCount: events.length,
    recentEvents,
    trend,
  };
};

export const getDriverLeaderboard = async (limit = 10) => {
  const drivers = await User.findAll({
    where: { role: "DRIVER" },
    attributes: ["id", "name", "email", "avatar", "role"],
    order: [["name", "ASC"]],
  });

  if (!drivers.length) return [];

  const driverIds = drivers.map((driver) => driver.id);
  const [events, completedTripsMap] = await Promise.all([
    DriverScoreEvent.findAll({
      where: { driverId: { [Op.in]: driverIds } },
      order: [["occurredAt", "ASC"], ["createdAt", "ASC"]],
      raw: true,
    }),
    getCompletedTripsCountMap(driverIds),
  ]);

  const groupedEvents = new Map();
  for (const event of events) {
    const key = String(event.driverId);
    const bucket = groupedEvents.get(key) || [];
    bucket.push(event);
    groupedEvents.set(key, bucket);
  }

  const leaderboard = drivers.map((driver) => {
    const scoreEvents = groupedEvents.get(String(driver.id)) || [];
    let score = SCORE_BASELINE;

    for (const event of scoreEvents) {
      score = clampScore(score + Number(event.pointsDelta || 0));
    }

    const completedTrips = completedTripsMap.get(String(driver.id)) || 0;
    return {
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        avatar: driver.avatar,
      },
      score,
      completedTrips,
      badge: getDriverExperienceBadge(completedTrips),
      recentDelta: scoreEvents.slice(-1)[0]?.pointsDelta || 0,
    };
  });

  const sorted = leaderboard.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.completedTrips !== a.completedTrips) return b.completedTrips - a.completedTrips;
    return a.driver.name.localeCompare(b.driver.name);
  });

  const normalizedLimit =
    limit === null || limit === undefined
      ? sorted.length
      : Math.max(Number(limit) || 10, 1);

  return sorted.slice(0, normalizedLimit).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
};

export const getDriverRankingProfile = async (driverId) => {
  const [summary, leaderboard] = await Promise.all([
    recomputeDriverScoreSummary(driverId),
    getDriverLeaderboard(null),
  ]);

  if (!summary) return null;

  const rankEntry = leaderboard.find((entry) => String(entry.driver.id) === String(driverId));

  return {
    ...summary,
    rank: rankEntry?.rank || leaderboard.length + 1,
    leaderboardSize: leaderboard.length,
  };
};

export const recordAccidentReclamationScoreEvent = async (reclamationId) => {
  const reclamation = await Reclamation.findByPk(reclamationId, {
    attributes: [
      "id",
      "userId",
      "type",
      "subject",
      "message",
      "vehicleName",
      "vehiclePlate",
      "createdAt",
    ],
  });

  if (!reclamation?.userId || !isAccidentType(reclamation.type)) {
    return null;
  }

  const sourceKey = `accident-reclamation:${reclamation.id}`;
  return upsertEvent({
    sourceKey,
    defaults: {
      driverId: reclamation.userId,
      reclamationId: reclamation.id,
      eventType: "ACCIDENT_RECLAMATION",
      pointsDelta: ACCIDENT_PENALTY,
      reason: buildScoreReason({
        eventType: "ACCIDENT_RECLAMATION",
        delta: ACCIDENT_PENALTY,
        vehicleLabel: buildVehicleLabel(reclamation),
      }),
      occurredAt: reclamation.createdAt || new Date(),
      metadata: {
        type: reclamation.type,
        subject: reclamation.subject,
      },
    },
  });
};

export const recordRouteDeviationScoreEvent = async ({ tripId, driverId, distanceMeters, recordedAt }) => {
  if (!tripId || !driverId) return null;

  const trip = await Trip.findByPk(tripId, {
    attributes: ["id", "userId", "startLocation", "endLocation", "scoreRouteDeviationApplied"],
  });

  if (!trip || String(trip.userId) !== String(driverId) || trip.scoreRouteDeviationApplied) {
    return null;
  }

  const sourceKey = `route-deviation:${trip.id}`;
  const event = await upsertEvent({
    sourceKey,
    defaults: {
      driverId,
      tripId: trip.id,
      eventType: "ROUTE_DEVIATION",
      pointsDelta: ROUTE_DEVIATION_PENALTY,
      reason: buildScoreReason({
        eventType: "ROUTE_DEVIATION",
        delta: ROUTE_DEVIATION_PENALTY,
        tripReference: buildTripReference(trip),
      }),
      occurredAt: recordedAt || new Date(),
      metadata: {
        distanceMeters: Number(distanceMeters) || 0,
      },
    },
  });

  await trip.update({ scoreRouteDeviationApplied: true });
  return event;
};

export const syncTripCompletionScoreEvent = async (tripId) => {
  const trip = await Trip.findByPk(tripId, {
    attributes: [
      "id",
      "userId",
      "startLocation",
      "endLocation",
      "plannedEndTime",
      "endTime",
      "status",
    ],
  });

  if (!trip?.userId || trip.status !== "completed") {
    return null;
  }

  const { pointsDelta, delayMinutes, onTime } = calculateTripCompletionScore(trip);
  const sourceKey = `trip-completion:${trip.id}`;

  return upsertEvent({
    sourceKey,
    defaults: {
      driverId: trip.userId,
      tripId: trip.id,
      eventType: "TRIP_COMPLETION",
      pointsDelta,
      reason: buildScoreReason({
        eventType: "TRIP_COMPLETION",
        delta: pointsDelta,
        delayMinutes,
        tripReference: buildTripReference(trip),
      }),
      occurredAt: trip.endTime || new Date(),
      metadata: {
        plannedEndTime: trip.plannedEndTime,
        actualEndTime: trip.endTime,
        delayMinutes,
        onTime,
      },
    },
    mutableFields: ["pointsDelta", "reason", "occurredAt", "metadata"],
  });
};

export const removeTripCompletionScoreEvent = async (tripId) => {
  const existing = await getLatestTripCompletionEvent(tripId);
  if (!existing) return null;
  await existing.destroy();
  return true;
};
