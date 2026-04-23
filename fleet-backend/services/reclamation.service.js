import { Op } from "sequelize";
import Reclamation from "../models/reclamation.model.js";
import User from "../models/user.model.js";
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

// ─────────────────────────────────────────────
// USER SERVICES
// ─────────────────────────────────────────────

export const createVehicleReclamationSvc = async (
  userId,
  vehicleId,
  subject,
  message,
  files = []
) => {
  const imageUrls = files.map((f) => f.path);

  const reclamation = await Reclamation.create({
    userId,
    vehicleId,
    subject,
    message,
    images: imageUrls,
  });

  const recipientIds = await buildRecipients(userId);

  publishSafely(
    FLEET_EVENTS.SYSTEM_ALERT,
    {
      recipientIds,
      title: 'Reclamation Submitted',
      message: `A vehicle reclamation was submitted by user ${userId}: "${subject}".`,
      metadata: {
        reclamationId: reclamation.id,
        vehicleId: reclamation.vehicleId ?? null,
        status: reclamation.status,
        submittedBy: userId,
      },
    },
    'SYSTEM_ALERT'
  );

  return reclamation;
};

export const createReclamationSvc = async (userId, subject, message) => {
  const reclamation = await Reclamation.create({ userId, subject, message });

  const recipientIds = await buildRecipients(userId);

  publishSafely(
    FLEET_EVENTS.SYSTEM_ALERT,
    {
      recipientIds,
      title: "Reclamation Submitted",
      message: `A new reclamation was submitted by user ${userId}: "${subject}".`,
      metadata: {
        reclamationId: reclamation.id,
        status: reclamation.status,
        submittedBy: userId,
      },
    },
    "SYSTEM_ALERT"
  );

  return reclamation;
};

export const getUserReclamationsSvc = async (userId, query, cacheKey = null) => {
  const { page = 1, limit = 10 } = query;
  const offset = (page - 1) * limit;

  const { count, rows } = await Reclamation.findAndCountAll({
    where: { userId },
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
  const reclamation = await Reclamation.findOne({ where: { id, userId } });
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

  publishSafely(
    FLEET_EVENTS.SYSTEM_UPDATE,
    {
      recipientIds,
      title: "Reclamation Updated",
      message: `Reclamation "${reclamation.subject}" was updated by user ${userId}.`,
      metadata: {
        reclamationId: reclamation.id,
        status: reclamation.status,
        updatedBy: userId,
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
  const reclamation = await Reclamation.findByPk(id);
  if (!reclamation) throw new Error("Reclamation not found");
  return reclamation;
};

export const updateReclamationStatusSvc = async (id, status) => {
  const reclamation = await Reclamation.findByPk(id);
  if (!reclamation) throw new Error("Reclamation not found");

  await reclamation.update({ status });

  // Notify the owner + all admins
  const recipientIds = await buildRecipientsWithOwner(reclamation.userId);

  publishSafely(
    FLEET_EVENTS.SYSTEM_ALERT,
    {
      recipientIds,
      title: "Reclamation Status Updated",
      message: `Reclamation "${reclamation.subject}" status changed to ${status}.`,
      metadata: {
        reclamationId: reclamation.id,
        status,
        ownerId: reclamation.userId,
      },
    },
    "SYSTEM_ALERT"
  );

  return reclamation;
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