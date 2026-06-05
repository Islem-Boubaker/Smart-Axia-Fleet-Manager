import { Op } from "sequelize";
import { sequelize } from "../config/connectdb.js";
import Trip from "../models/trip.model.js";
import TripStop from "../models/TripStop.js";
import { eventBus, FLEET_EVENTS } from "../events/eventBus.js";

const createError = (message, status = 400, code = "BAD_REQUEST") => {
  const error = new Error(message);
  error.status = status;
  error.statusCode = status;
  error.code = code;
  return error;
};

const ensureTrip = async (tripId) => {
  const trip = await Trip.findByPk(tripId);
  if (!trip) throw createError("Trip not found", 404, "NOT_FOUND");
  return trip;
};

const ensureMutableTrip = (trip) => {
  if (["completed", "cancelled"].includes(trip.status)) {
    throw createError("Cannot modify stops for completed or cancelled trip", 409, "CONFLICT");
  }
};

const ensureDriverOwnership = (trip, callerRole, callerId) => {
  if (callerRole === "DRIVER" && String(trip.userId) !== String(callerId)) {
    throw createError("Access denied", 403, "FORBIDDEN");
  }
};

const ensureStopBelongsToTrip = (stop, tripId) => {
  if (!stop || String(stop.tripId) !== String(tripId)) {
    throw createError("Stop not found for this trip", 404, "NOT_FOUND");
  }
};

const normalizeStopsInput = (stopsInput) => {
  if (Array.isArray(stopsInput?.stops)) return stopsInput.stops;
  if (Array.isArray(stopsInput)) return stopsInput;
  return [stopsInput];
};

const ensureNoDuplicateOrder = (orders = []) => {
  const unique = new Set(orders);
  if (unique.size !== orders.length) {
    throw createError("Duplicate stopOrder values are not allowed", 409, "CONFLICT");
  }
};

export const addStops = async (tripId, stopsInput) => {
  const trip = await ensureTrip(tripId);
  ensureMutableTrip(trip);

  const stops = normalizeStopsInput(stopsInput).filter(Boolean);
  if (stops.length === 0) {
    throw createError("No stops provided", 422, "VALIDATION_ERROR");
  }

  // Reject any attempt to create a second destination stop via this endpoint
  if (stops.some((s) => s.isDestination)) {
    throw createError("Cannot add a second destination stop", 409, "DESTINATION_ALREADY_EXISTS");
  }

  const newOrders = stops.map((stop) => stop.stopOrder);
  ensureNoDuplicateOrder(newOrders);

  const existing = await TripStop.findAll({
    where: { tripId },
  });

  const existingOrders = new Set(existing.map((stop) => stop.stopOrder));
  for (const stopOrder of newOrders) {
    if (existingOrders.has(stopOrder)) {
      throw createError(`stopOrder ${stopOrder} already exists in this trip`, 409, "CONFLICT");
    }
  }

  const destination = existing.find((s) => s.isDestination);

  const created = await sequelize.transaction(async (transaction) => {
    const payload = stops.map((stop) => ({ ...stop, tripId }));
    const newStops = await TripStop.bulkCreate(payload, { validate: true, returning: true, transaction });

    // Re-pin destination to max stopOrder + 1 so it always stays last
    if (destination) {
      const allOrders = [
        ...existing.filter((s) => !s.isDestination).map((s) => s.stopOrder),
        ...newOrders,
      ];
      const maxOrder = Math.max(...allOrders);
      if (destination.stopOrder <= maxOrder) {
        await destination.update({ stopOrder: maxOrder + 1 }, { transaction });
      }
    }

    return newStops;
  });

  return created;
};

export const getStops = async (tripId, callerRole, callerId, cacheKey = null) => {
  const trip = await ensureTrip(tripId);
  ensureDriverOwnership(trip, callerRole, callerId);

  return TripStop.findAll({
    where: { tripId },
    order: [["stopOrder", "ASC"]],
  });
};

export const updateStop = async (tripId, stopId, data) => {
  const trip = await ensureTrip(tripId);
  ensureMutableTrip(trip);

  const stop = await TripStop.findByPk(stopId);
  ensureStopBelongsToTrip(stop, tripId);

  if (["reached", "skipped"].includes(stop.status)) {
    throw createError("Cannot update reached or skipped stop", 409, "CONFLICT");
  }

  if (data.stopOrder !== undefined) {
    const conflict = await TripStop.findOne({
      where: {
        tripId,
        stopOrder: data.stopOrder,
        id: { [Op.ne]: stopId },
      },
    });

    if (conflict) {
      throw createError("stopOrder already exists in this trip", 409, "CONFLICT");
    }
  }

  const allowed = [
    "locationName",
    "stopOrder",
    "latitude",
    "longitude",
    "estimatedArrival",
    "notes",
  ];

  const updates = {};
  for (const key of allowed) {
    if (data[key] !== undefined) updates[key] = data[key];
  }

  await stop.update(updates);
  return stop;
};

export const deleteStop = async (tripId, stopId) => {
  const trip = await ensureTrip(tripId);
  ensureMutableTrip(trip);

  const stop = await TripStop.findByPk(stopId);
  ensureStopBelongsToTrip(stop, tripId);

  if (stop.isDestination) {
    throw createError("Cannot delete the destination stop", 409, "DESTINATION_NOT_DELETABLE");
  }

  if (stop.status === "reached") {
    throw createError("Cannot delete a reached stop", 409, "CONFLICT");
  }

  await stop.destroy();
  return null;
};

export const reachStop = async (tripId, stopId, callerRole, callerId, arrivalTime) => {
  const trip = await ensureTrip(tripId);
  ensureDriverOwnership(trip, callerRole, callerId);

  const stop = await TripStop.findByPk(stopId);
  ensureStopBelongsToTrip(stop, tripId);

  if (trip.status !== "ongoing") {
    if (trip.status === "completed" && stop.status === "reached") {
      return stop;
    }

    throw createError("Trip must be ongoing to reach a stop", 409, "CONFLICT");
  }

  if (stop.status !== "pending") {
    throw createError("Only pending stops can be marked as reached", 409, "CONFLICT");
  }

  const reachedAt = arrivalTime ? new Date(arrivalTime) : new Date();

  await stop.update({
    status: "reached",
    arrivalTime: reachedAt,
  });

  // Auto-complete only when ALL stops (including destination) are resolved
  const destination = stop.isDestination ? stop : await TripStop.findOne({
    where: { tripId, isDestination: true },
  });

  const destinationReached = destination && destination.status === "reached";
  const pendingIntermediate = await TripStop.count({
    where: { tripId, isDestination: false, status: "pending" },
  });

  if (destinationReached && pendingIntermediate === 0) {
    await trip.update({
      status: "completed",
      endTime: reachedAt,
    });

    try {
      eventBus.emitEvent(FLEET_EVENTS.TRIP_COMPLETED, {
        tripId: trip.id,
        userId: trip.userId,
      });
    } catch (error) {
      console.error("[EventBus] Failed to emit trip completion event:", error.message);
    }
  }

  return stop;
};

export const skipStop = async (tripId, stopId, callerRole, callerId, notes) => {
  const trip = await ensureTrip(tripId);
  ensureDriverOwnership(trip, callerRole, callerId);

  if (trip.status !== "ongoing") {
    throw createError("Trip must be ongoing to skip a stop", 409, "CONFLICT");
  }

  const stop = await TripStop.findByPk(stopId);
  ensureStopBelongsToTrip(stop, tripId);

  if (stop.isDestination) {
    throw createError("Cannot skip the destination stop", 409, "DESTINATION_NOT_SKIPPABLE");
  }

  if (stop.status !== "pending") {
    throw createError("Only pending stops can be skipped", 409, "CONFLICT");
  }

  const updates = { status: "skipped" };
  if (notes !== undefined) updates.notes = notes;

  await stop.update(updates);
  return stop;
};

export const reorderStops = async (tripId, orderArray = []) => {
  const trip = await ensureTrip(tripId);

  if (trip.status !== "scheduled") {
    throw createError("Stops can only be reordered when trip is scheduled", 409, "CONFLICT");
  }

  const inputIds = orderArray.map((item) => item.stopId);
  const inputOrders = orderArray.map((item) => item.stopOrder);

  ensureNoDuplicateOrder(inputOrders);

  const stops = await TripStop.findAll({ where: { tripId } });
  const tripStopIds = new Set(stops.map((stop) => String(stop.id)));
  const destination = stops.find((s) => s.isDestination);

  for (const stopId of inputIds) {
    if (!tripStopIds.has(String(stopId))) {
      throw createError("One or more stops do not belong to this trip", 422, "VALIDATION_ERROR");
    }
  }

  // Reject any payload that tries to reorder the destination away from last position
  if (destination) {
    const destEntry = orderArray.find((item) => String(item.stopId) === String(destination.id));
    if (destEntry) {
      const maxRequestedOrder = Math.max(...inputOrders);
      if (destEntry.stopOrder !== maxRequestedOrder) {
        throw createError(
          "The destination stop must remain last in stopOrder",
          409,
          "DESTINATION_MUST_BE_LAST"
        );
      }
    }
  }

  await sequelize.transaction(async (transaction) => {
    for (const item of orderArray) {
      await TripStop.update(
        { stopOrder: item.stopOrder },
        {
          where: { id: item.stopId, tripId },
          transaction,
        }
      );
    }
  });

  return TripStop.findAll({
    where: { tripId },
    order: [["stopOrder", "ASC"]],
  });
};
