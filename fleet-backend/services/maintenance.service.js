import { Op } from "sequelize";
import Maintenance from "../models/maintenance.model.js";
import Vehicle from "../models/vehicle.model.js";
import { getPagination, getPagingData } from "../utils/pagination.js";
import { eventBus } from "../events/eventBus.js";

const ACTIVE_MAINTENANCE_STATUSES = ["scheduled", "in_progress"];

const createError = (message, status = 400, code = "BAD_REQUEST", errors = []) => {
  const error = new Error(message);
  error.status = status;
  error.statusCode = status;
  error.code = code;
  error.errors = errors;
  return error;
};

const STATUS_TRANSITIONS = {
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["completed"],
  completed: [],
  cancelled: [],
};

const ensureVehicleExists = async (vehicleId) => {
  const vehicle = await Vehicle.findByPk(vehicleId);
  if (!vehicle) {
    throw createError("Vehicle not found", 404, "NOT_FOUND");
  }
  return vehicle;
};

const ensureMaintenanceExists = async (id) => {
  const maintenance = await Maintenance.findByPk(id, {
    include: [
      { model: Vehicle, as: "vehicle" },
    ],
  });

  if (!maintenance) {
    throw createError("Maintenance not found", 404, "NOT_FOUND");
  }

  return maintenance;
};

const ensureNoScheduleConflict = async (vehicleId, scheduledDate, excludeId = null) => {
  const where = {
    vehicleId,
    status: { [Op.in]: ACTIVE_MAINTENANCE_STATUSES },
    scheduledDate: new Date(scheduledDate),
  };

  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }

  const conflict = await Maintenance.findOne({ where });
  if (conflict) {
    throw createError(
      "Vehicle already has a maintenance scheduled at this date",
      409,
      "CONFLICT"
    );
  }
};

const setVehicleAvailabilityFromMaintenance = async (vehicleId, status) => {
  const vehicle = await Vehicle.findByPk(vehicleId);
  if (!vehicle) return;

  if (status === "in_progress") {
    await vehicle.update({ status: "IN_MAINTENANCE" });
    return;
  }

  if (["completed", "cancelled"].includes(status) && vehicle.status === "IN_MAINTENANCE") {
    await vehicle.update({ status: "AVAILABLE" });
  }
};

const emitMaintenanceEvent = (event, payload) => {
  try {
    eventBus.emit(event, payload);
  } catch (error) {
    console.error(`[EventBus] Failed to emit ${event}:`, error.message);
  }
};

export const createMaintenance = async (payload, userId) => {
  const vehicle = await ensureVehicleExists(payload.vehicleId);
  await ensureNoScheduleConflict(payload.vehicleId, payload.scheduledDate);

  const maintenance = await Maintenance.create({
    ...payload,
    vehiclePlate: vehicle.plaque_immatriculation || payload.vehiclePlate || "N/A",
    status: "scheduled",
    createdBy: userId,
    updatedBy: userId,
  });

  emitMaintenanceEvent("maintenance:created", { maintenance, vehicle });

  return Maintenance.findByPk(maintenance.id, {
    include: [{ model: Vehicle, as: "vehicle" }],
  });
};

export const getAllMaintenances = async (query = {}, callerRole = null, callerId = null) => {
  const { page, limit, offset } = getPagination(query);
  const where = {};

  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.vehicleId) where.vehicleId = query.vehicleId;
  if (query.technician) where.technician = { [Op.iLike]: `%${query.technician}%` };

  if (query.dateFrom || query.dateTo) {
    where.scheduledDate = {};
    if (query.dateFrom) where.scheduledDate[Op.gte] = new Date(query.dateFrom);
    if (query.dateTo) where.scheduledDate[Op.lte] = new Date(query.dateTo);
  }

  if (callerRole === "DRIVER") {
    where.createdBy = callerId;
  }

  const sortBy = query.sortBy || "scheduledDate";
  const sortOrder = query.sortOrder || "ASC";

  const { count, rows } = await Maintenance.findAndCountAll({
    where,
    include: [{ model: Vehicle, as: "vehicle" }],
    order: [[sortBy, sortOrder]],
    limit,
    offset,
  });

  return getPagingData(count, rows, page, limit);
};

export const getMaintenanceById = async (id, callerRole = null, callerId = null) => {
  const maintenance = await ensureMaintenanceExists(id);

  if (callerRole === "DRIVER" && String(maintenance.createdBy) !== String(callerId)) {
    throw createError("Forbidden", 403, "FORBIDDEN");
  }

  return maintenance;
};

export const updateMaintenance = async (id, updates, userId) => {
  const maintenance = await ensureMaintenanceExists(id);

  if (["completed", "cancelled"].includes(maintenance.status)) {
    throw createError("Cannot update completed or cancelled maintenance", 409, "CONFLICT");
  }

  const blockedFields = ["status", "vehicleId", "completedAt", "createdBy"];
  for (const field of blockedFields) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      delete updates[field];
    }
  }

  if (updates.scheduledDate) {
    await ensureNoScheduleConflict(maintenance.vehicleId, updates.scheduledDate, id);
  }

  await maintenance.update({
    ...updates,
    updatedBy: userId,
  });

  return maintenance;
};

export const deleteMaintenance = async (id) => {
  const maintenance = await ensureMaintenanceExists(id);

  if (maintenance.status === "completed") {
    throw createError("Cannot delete completed maintenance", 409, "CONFLICT");
  }

  if (maintenance.status === "in_progress") {
    throw createError("Cannot delete in-progress maintenance", 409, "CONFLICT");
  }

  await maintenance.destroy();
  return { id };
};

export const updateStatus = async (id, targetStatus, userId) => {
  const maintenance = await ensureMaintenanceExists(id);
  const allowed = STATUS_TRANSITIONS[maintenance.status] || [];

  if (!allowed.includes(targetStatus)) {
    throw createError(
      `Cannot transition from '${maintenance.status}' to '${targetStatus}'`,
      409,
      "CONFLICT"
    );
  }

  const updateData = {
    status: targetStatus,
    updatedBy: userId,
  };

  if (targetStatus === "completed") {
    updateData.completedAt = new Date();
  }

  await maintenance.update(updateData);
  await setVehicleAvailabilityFromMaintenance(maintenance.vehicleId, targetStatus);

  if (targetStatus === "in_progress") {
    emitMaintenanceEvent("maintenance:started", { maintenance, vehicle: maintenance.vehicle });
  } else if (targetStatus === "completed") {
    emitMaintenanceEvent("maintenance:completed", { maintenance, vehicle: maintenance.vehicle });
  } else if (targetStatus === "cancelled") {
    emitMaintenanceEvent("maintenance:cancelled", { maintenance, vehicle: maintenance.vehicle });
  }

  return maintenance;
};

export const startMaintenance = async (id, userId) => {
  const maintenance = await ensureMaintenanceExists(id);
  if (maintenance.status !== "scheduled") {
    throw createError(
      `Maintenance can only be started from 'scheduled' status. Current status: ${maintenance.status}`,
      409,
      "CONFLICT"
    );
  }

  return updateStatus(id, "in_progress", userId);
};

export const completeMaintenance = async (id, userId, updates = {}) => {
  const maintenance = await ensureMaintenanceExists(id);

  if (maintenance.status !== "in_progress") {
    throw createError("Cannot complete maintenance unless it is in_progress", 409, "CONFLICT");
  }

  const allowedSettlements = {};
  if (updates.cost !== undefined) allowedSettlements.cost = updates.cost;
  if (updates.mileage !== undefined) allowedSettlements.mileage = updates.mileage;
  if (updates.description !== undefined) allowedSettlements.description = updates.description;
  if (updates.attachments !== undefined) allowedSettlements.attachments = updates.attachments;

  if (Object.keys(allowedSettlements).length > 0) {
    await maintenance.update({ ...allowedSettlements, updatedBy: userId });
  }

  return updateStatus(id, "completed", userId);
};

export const cancelMaintenance = async (id, userId) => {
  const maintenance = await ensureMaintenanceExists(id);

  if (maintenance.status !== "scheduled") {
    throw createError("Only scheduled maintenance can be cancelled", 409, "CONFLICT");
  }

  return updateStatus(id, "cancelled", userId);
};

export const getUpcomingMaintenances = async (query = {}) => {
  const days = Math.min(Math.max(Number(query.days || 7), 1), 30);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);

  const now = new Date();
  const windowEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const where = {
    status: "scheduled",
    scheduledDate: {
      [Op.between]: [now, windowEnd],
    },
  };

  if (query.priority) where.priority = query.priority;
  if (query.vehicleId) where.vehicleId = query.vehicleId;

  const items = await Maintenance.findAll({
    where,
    include: [{ model: Vehicle, as: "vehicle" }],
    order: [["scheduledDate", "ASC"]],
    limit,
  });

  return {
    windowDays: days,
    count: items.length,
    items,
  };
};

export const getOverdueMaintenances = async (query = {}) => {
  const now = new Date();
  const { page, limit, offset } = getPagination(query);

  const where = {
    status: "scheduled",
    scheduledDate: {
      [Op.lt]: now,
    },
  };

  if (query.priority) where.priority = query.priority;
  if (query.vehicleId) where.vehicleId = query.vehicleId;

  const { count, rows } = await Maintenance.findAndCountAll({
    where,
    include: [{ model: Vehicle, as: "vehicle" }],
    order: [["scheduledDate", "ASC"]],
    limit,
    offset,
  });

  const items = rows.map((row) => {
    const plain = row.toJSON();
    return {
      ...plain,
      daysOverdue: Math.floor((now.getTime() - new Date(plain.scheduledDate).getTime()) / 86400000),
    };
  });

  return {
    count,
    items,
    page,
    limit,
  };
};

export const checkVehicleAvailableForTrip = async (vehicleId, tripStartDate, tripEndDate) => {
  const vehicle = await Vehicle.findByPk(vehicleId);
  if (!vehicle) {
    throw createError("Vehicle not found", 404, "NOT_FOUND");
  }

  if (vehicle.status === "IN_MAINTENANCE") {
    throw createError(
      `Vehicle ${vehicle.plaque_immatriculation || vehicle.id} is currently under maintenance and cannot be assigned to a trip.`,
      409,
      "VEHICLE_IN_MAINTENANCE"
    );
  }

  const overlappingMaintenance = await Maintenance.findOne({
    where: {
      vehicleId,
      status: { [Op.in]: ["scheduled", "in_progress"] },
      scheduledDate: {
        [Op.between]: [new Date(tripStartDate), new Date(tripEndDate)],
      },
    },
  });

  if (overlappingMaintenance) {
    const error = createError(
      `Vehicle has maintenance scheduled on ${new Date(overlappingMaintenance.scheduledDate).toLocaleDateString()} which conflicts with the requested trip dates.`,
      409,
      "VEHICLE_MAINTENANCE_CONFLICT"
    );
    error.data = { maintenanceId: overlappingMaintenance.id };
    throw error;
  }
};
