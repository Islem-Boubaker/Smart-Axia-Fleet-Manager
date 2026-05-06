import { Op } from "sequelize";
import Reclamation from "../models/reclamation.model.js";
import User from "../models/user.model.js";
import Vehicle from "../models/vehicle.model.js";
import { recordAccidentReclamationScoreEvent } from "./driverScore.service.js";
import { eventBus, FLEET_EVENTS } from "../events/eventBus.js";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const publishSafely = (event, payload, label) => {
  try {
    eventBus.emitEvent(event, payload);
  } catch (err) {
    console.error(`[EventBus] ${label} publish failed:`, err);
  }
};

/**
 * Returns all user IDs with role ADMIN or MANAGER.
 * Used to include admins in every notification recipientIds.
 */
const resolveAdminIds = async () => {
  const admins = await User.findAll({
    where: { role: { [Op.in]: ["ADMIN", "MANAGER"] } },
    attributes: ["id"],
  });
  return admins.map((u) => u.id);
};

/**
 * Builds a deduplicated recipient list: [userId, ...adminIds]
 * The user themselves is always first, admins appended.
 * Filters out nulls and duplicates (e.g. if the user IS an admin).
 */
const buildRecipients = async (userId) => {
  const adminIds = await resolveAdminIds();
  return [...new Set([userId, ...adminIds].filter(Boolean))];
};

/**
 * Builds a recipient list for admin-only notifications.
 * Used when the action is admin-side (status update, admin delete).
 * Still notifies the reclamation owner + all admins.
 */
const buildRecipientsWithOwner = async (ownerId) => {
  return buildRecipients(ownerId); // same logic, clearer call-site intent
};

const getUserDisplayName = async (userId) => {
  if (!userId) return "the user";
  const user = await User.findByPk(userId, { attributes: ["id", "name", "email"] });
  return user?.name || user?.email || "the user";
};

const normalizeType = (type) => {
  const normalized = String(type || "general").trim().toLowerCase();
  const allowed = new Set(["general", "vehicle", "maintenance", "trip", "delay", "technical", "damage", "accident", "other"]);
  return allowed.has(normalized) ? normalized : "general";
};

const parseMetadata = (value) => {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const RECLAMATION_STATUS_MAP = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
};

const normalizeReclamationStatus = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (!RECLAMATION_STATUS_MAP[normalized]) {
    const error = new Error(`Invalid reclamation status: ${value}`);
    error.status = 400;
    error.statusCode = 400;
    error.code = "BAD_REQUEST";
    throw error;
  }

  return RECLAMATION_STATUS_MAP[normalized];
};

const vehicleLabel = ({ vehicleName, vehiclePlate }) => {
  if (vehicleName && vehiclePlate) return `${vehicleName} (${vehiclePlate})`;
  if (vehicleName) return vehicleName;
  if (vehiclePlate) return `vehicle ${vehiclePlate}`;
  return "vehicle";
};

const buildContext = async (userId, payload = {}) => {
  const user = await User.findByPk(userId, { attributes: ["id", "name", "email"] });
  const driverName = payload.driverName || user?.name || user?.email || "the driver";
  let vehicle = null;

  if (payload.vehicleId) {
    vehicle = await Vehicle.findByPk(payload.vehicleId, {
      attributes: ["id", "name", "plaque_immatriculation", "model"],
    });
  }

  const vehicleName =
    payload.vehicleName ||
    vehicle?.name ||
    vehicle?.model ||
    null;
  const vehiclePlate =
    payload.vehiclePlate ||
    vehicle?.plaque_immatriculation ||
    null;
  const metadata = {
    ...parseMetadata(payload.metadata),
    driverName,
    vehicleName,
    vehiclePlate,
  };

  if (payload.tripId) metadata.tripId = payload.tripId;
  if (payload.reclamationTypeLabel) metadata.reclamationTypeLabel = payload.reclamationTypeLabel;
  if (payload.vehicleId || vehicle?.id) metadata.vehicleId = payload.vehicleId || vehicle.id;

  return {
    driverName,
    vehicleName,
    vehiclePlate,
    metadata,
  };
};

const reclamationInclude = [
  { model: User, as: "driver", attributes: ["id", "name", "email"] },
  { model: Vehicle, as: "vehicle", attributes: ["id", "name", "plaque_immatriculation", "model"] },
];

const hydrateReclamation = async (reclamation) => {
  if (!reclamation?.id) return reclamation;
  return Reclamation.findByPk(reclamation.id, { include: reclamationInclude });
};

const buildSubmittedMessage = ({ submittedBy, type, subject, vehicleName, vehiclePlate }) => {
  if (type === "maintenance") {
    return `${submittedBy} submitted a maintenance reclamation for ${vehicleLabel({ vehicleName, vehiclePlate })}: "${subject}".`;
  }
  if (type === "vehicle" || vehicleName || vehiclePlate) {
    return `${submittedBy} submitted a vehicle reclamation for ${vehicleLabel({ vehicleName, vehiclePlate })}: "${subject}".`;
  }
  return `${submittedBy} submitted a new reclamation: "${subject}".`;
};

// ─────────────────────────────────────────────
// USER SERVICES
// ─────────────────────────────────────────────

export const createVehicleReclamationSvc = async (
  userId,
  vehicleId,
  subject,
  message,
  files = [],
  options = {}
) => {
  const imageUrls = files.map((f) => f.path);
  const type = normalizeType(options.type || "vehicle");
  const context = await buildContext(userId, { ...options, vehicleId });

  const reclamation = await Reclamation.create({
    userId,
    vehicleId,
    subject,
    message,
    images: imageUrls,
    type,
    ...context,
  });

  const recipientIds = await buildRecipients(userId);
  const submittedBy = await getUserDisplayName(userId);
  const alertMessage = buildSubmittedMessage({
    submittedBy,
    type,
    subject,
    vehicleName: context.vehicleName,
    vehiclePlate: context.vehiclePlate,
  });

  publishSafely(
    FLEET_EVENTS.SYSTEM_ALERT,
    {
      recipientIds,
      title: 'Reclamation Submitted',
      message: alertMessage,
      metadata: {
        reclamationId: reclamation.id,
        vehicleId: reclamation.vehicleId ?? null,
        vehicleName: context.vehicleName,
        vehiclePlate: context.vehiclePlate,
        type,
        status: reclamation.status,
        submittedBy: userId,
        submittedByName: submittedBy,
      },
    },
    'SYSTEM_ALERT'
  );

  await recordAccidentReclamationScoreEvent(reclamation.id);
  return hydrateReclamation(reclamation);
};

export const createReclamationSvc = async (userId, payloadOrSubject, maybeMessage) => {
  const payload =
    typeof payloadOrSubject === "object" && payloadOrSubject !== null
      ? payloadOrSubject
      : { subject: payloadOrSubject, message: maybeMessage };
  const type = normalizeType(payload.type);
  const context = await buildContext(userId, payload);

  const reclamation = await Reclamation.create({
    userId,
    subject: payload.subject,
    message: payload.message,
    vehicleId: payload.vehicleId || null,
    type,
    ...context,
  });

  const recipientIds = await buildRecipients(userId);
  const submittedBy = await getUserDisplayName(userId);
  const alertMessage = buildSubmittedMessage({
    submittedBy,
    type,
    subject: payload.subject,
    vehicleName: context.vehicleName,
    vehiclePlate: context.vehiclePlate,
  });

  publishSafely(
    FLEET_EVENTS.SYSTEM_ALERT,
    {
      recipientIds,
      title: "Reclamation Submitted",
      message: alertMessage,
      metadata: {
        reclamationId: reclamation.id,
        vehicleId: reclamation.vehicleId ?? null,
        vehicleName: context.vehicleName,
        vehiclePlate: context.vehiclePlate,
        type,
        status: reclamation.status,
        submittedBy: userId,
        submittedByName: submittedBy,
      },
    },
    "SYSTEM_ALERT"
  );

  await recordAccidentReclamationScoreEvent(reclamation.id);
  return hydrateReclamation(reclamation);
};

export const getUserReclamationsSvc = async (userId, query, cacheKey = null) => {
  const { page = 1, limit = 10 } = query;
  const offset = (page - 1) * limit;

  const { count, rows } = await Reclamation.findAndCountAll({
    where: { userId },
    include: reclamationInclude,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["createdAt", "DESC"]],
  });

  return {
    total: count,
    page: parseInt(page),
    pages: Math.ceil(count / limit),
    data: rows,
  };
};

export const getMyReclamationByIdSvc = async (userId, id, cacheKey = null) => {
  const reclamation = await Reclamation.findOne({ where: { id, userId }, include: reclamationInclude });
  if (!reclamation) throw new Error("Reclamation not found or unauthorized");
  return reclamation;
};

export const updateMyReclamationSvc = async (userId, id, body) => {
  const reclamation = await Reclamation.findOne({ where: { id, userId } });
  if (!reclamation) throw new Error("Reclamation not found or unauthorized");
  if (reclamation.status !== "PENDING")
    throw new Error("Cannot update processed reclamation");

  await reclamation.update(body);

  const recipientIds = await buildRecipients(userId);
  const updatedBy = await getUserDisplayName(userId);

  publishSafely(
    FLEET_EVENTS.SYSTEM_UPDATE,
    {
      recipientIds,
      title: "Reclamation Updated",
      message: `${updatedBy} updated reclamation "${reclamation.subject}".`,
      metadata: {
        reclamationId: reclamation.id,
        status: reclamation.status,
        updatedBy: userId,
        updatedByName: updatedBy,
      },
    },
    "SYSTEM_UPDATE"
  );

  return reclamation;
};

export const deleteMyReclamationSvc = async (userId, id) => {
  const reclamation = await Reclamation.findOne({ where: { id, userId } });
  if (!reclamation) throw new Error("Reclamation not found or unauthorized");

  const { subject } = reclamation;
  await reclamation.destroy();

  // Only notify the user — admins don't need to know about user self-deletes
  publishSafely(
    FLEET_EVENTS.SYSTEM_UPDATE,
    {
      recipientIds: [userId].filter(Boolean),
      title: "Reclamation Deleted",
      message: `Your reclamation "${subject}" was deleted.`,
      metadata: { reclamationId: id },
    },
    "SYSTEM_UPDATE"
  );
};

// ─────────────────────────────────────────────
// ADMIN SERVICES
// ─────────────────────────────────────────────

export const getAllReclamationsSvc = async (query, cacheKey = null) => {
  const { page = 1, limit = 10 } = query;
  const offset = (page - 1) * limit;

  const { count, rows } = await Reclamation.findAndCountAll({
    include: reclamationInclude,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["createdAt", "DESC"]],
  });

  return {
    total: count,
    page: parseInt(page),
    pages: Math.ceil(count / limit),
    data: rows,
  };
};

export const getReclamationByIdSvc = async (id, cacheKey = null) => {
  const reclamation = await Reclamation.findByPk(id, { include: reclamationInclude });
  if (!reclamation) throw new Error("Reclamation not found");
  return reclamation;
};

export const updateReclamationStatusSvc = async (id, status, options = {}) => {
  const reclamation = await Reclamation.findByPk(id);
  if (!reclamation) throw new Error("Reclamation not found");

  const normalizedStatus = normalizeReclamationStatus(status);
  await reclamation.update({ status: normalizedStatus });

  // Notify the owner + all admins
  const recipientIds = await buildRecipientsWithOwner(reclamation.userId);
  const triggerSource = options.source === "maintenance" ? "maintenance workflow" : "driver issues";
  const message =
    options.message ||
    `Reclamation "${reclamation.subject}" status changed to ${normalizedStatus.replace(/_/g, " ")}.`;

  publishSafely(
    FLEET_EVENTS.SYSTEM_ALERT,
    {
      recipientIds,
      title: "Reclamation Status Updated",
      message,
      metadata: {
        reclamationId: reclamation.id,
        status: normalizedStatus,
        ownerId: reclamation.userId,
        source: triggerSource,
        maintenanceId: options.maintenanceId || null,
      },
    },
    "SYSTEM_ALERT"
  );

  return hydrateReclamation(reclamation);
};

export const syncReclamationStatusFromMaintenance = async (reclamationId, maintenanceStatus, options = {}) => {
  if (!reclamationId) return null;

  const normalizedMaintenanceStatus = String(maintenanceStatus || "").trim().toLowerCase();

  if (normalizedMaintenanceStatus === "in progress" || normalizedMaintenanceStatus === "in_progress") {
    return updateReclamationStatusSvc(reclamationId, "IN_PROGRESS", {
      ...options,
      source: "maintenance",
      message: options.message || 'The linked maintenance has started, so this issue was moved to In Progress.',
    });
  }

  if (normalizedMaintenanceStatus === "completed") {
    return updateReclamationStatusSvc(reclamationId, "RESOLVED", {
      ...options,
      source: "maintenance",
      message: options.message || 'The linked maintenance was completed, so this issue was marked as Resolved.',
    });
  }

  return null;
};

export const deleteReclamationSvc = async (id) => {
  const reclamation = await Reclamation.findByPk(id);
  if (!reclamation) throw new Error("Reclamation not found");

  const { userId, subject } = reclamation;
  await reclamation.destroy();

  // Notify the owner that their reclamation was removed by admin
  publishSafely(
    FLEET_EVENTS.SYSTEM_UPDATE,
    {
      recipientIds: [userId].filter(Boolean),
      title: "Reclamation Removed",
      message: `Your reclamation "${subject}" has been removed by administration.`,
      metadata: { reclamationId: id },
    },
    "SYSTEM_UPDATE"
  );
};

// ─────────────────────────────────────────────
// FILTER & SEARCH
// ─────────────────────────────────────────────

export const getReclamationsByStatusSvc = async (status, cacheKey = null) => {
  return await Reclamation.findAll({
    where: { status },
    include: reclamationInclude,
    order: [["createdAt", "DESC"]],
  });
};

export const searchReclamationsSvc = async (query, cacheKey = null) => {
  const {
    keyword,
    status,
    userId,
    vehicleId,
    startDate,
    endDate,
    page = 1,
    limit = 10,
  } = query;

  const offset = (page - 1) * limit;
  const where = {};

  if (keyword) {
    where[Op.or] = [
      { subject: { [Op.iLike]: `%${keyword}%` } },
      { message: { [Op.iLike]: `%${keyword}%` } },
    ];
  }

  if (status)    where.status    = status;
  if (userId)    where.userId    = userId;
  if (vehicleId) where.vehicleId = vehicleId;

  if (startDate && endDate) {
    where.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  }

  const { count, rows } = await Reclamation.findAndCountAll({
    where,
    include: reclamationInclude,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["createdAt", "DESC"]],
  });

  return {
    total: count,
    page: parseInt(page),
    pages: Math.ceil(count / limit),
    data: rows,
  };
};

// ─────────────────────────────────────────────
// FILE UPLOAD
// ─────────────────────────────────────────────

export const uploadAttachmentSvc = async (id, files) => {
  const reclamation = await Reclamation.findByPk(id);
  if (!reclamation) throw new Error('Reclamation not found');

  const newUrls = files?.map((f) => f.path) ?? [];

  // Merge with existing images instead of overwriting
  const existing = reclamation.images ?? [];
  await reclamation.update({ images: [...existing, ...newUrls] });

  return reclamation;
};
