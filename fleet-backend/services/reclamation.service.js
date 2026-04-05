import { Op } from "sequelize";
import Reclamation from "../models/reclamation.model.js";

/**
 * =========================
 * 👤 USER SERVICES
 * =========================
 */

// Create vehicle reclamation
export const createVehicleReclamationSvc = async (
  userId,
  vehicleId,
  subject,
  message
) => {
  return await Reclamation.create({
    userId,
    vehicleId,
    subject,
    message,
  });
};

// Create general reclamation
export const createReclamationSvc = async (
  userId,
  subject,
  message,
  vehicleId = null
) => {
  return await Reclamation.create({
    userId,
    vehicleId,
    subject,
    message,
  });
};

// Get user reclamations (with pagination)
export const getUserReclamationsSvc = async (userId, query) => {
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

// Get single reclamation (owner)
export const getMyReclamationByIdSvc = async (userId, id) => {
  const reclamation = await Reclamation.findOne({
    where: { id, userId },
  });

  if (!reclamation) {
    throw new Error("Reclamation not found or unauthorized");
  }

  return reclamation;
};

// Update my reclamation
export const updateMyReclamationSvc = async (userId, id, body) => {
  const reclamation = await Reclamation.findOne({
    where: { id, userId },
  });

  if (!reclamation) {
    throw new Error("Reclamation not found or unauthorized");
  }

  if (reclamation.status !== "PENDING") {
    throw new Error("Cannot update processed reclamation");
  }

  await reclamation.update(body);

  return reclamation;
};

// Delete my reclamation
export const deleteMyReclamationSvc = async (userId, id) => {
  const reclamation = await Reclamation.findOne({
    where: { id, userId },
  });

  if (!reclamation) {
    throw new Error("Reclamation not found or unauthorized");
  }

  await reclamation.destroy();
};

/**
 * =========================
 * 🛠 ADMIN SERVICES
 * =========================
 */

// Get all reclamations
export const getAllReclamationsSvc = async (query) => {
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

// Get reclamation by ID
export const getReclamationByIdSvc = async (id) => {
  const reclamation = await Reclamation.findByPk(id);

  if (!reclamation) {
    throw new Error("Reclamation not found");
  }

  return reclamation;
};

// Update status
export const updateReclamationStatusSvc = async (id, status) => {
  const reclamation = await Reclamation.findByPk(id);

  if (!reclamation) {
    throw new Error("Reclamation not found");
  }

  await reclamation.update({ status });

  return reclamation;
};

// Delete (admin)
export const deleteReclamationSvc = async (id) => {
  const reclamation = await Reclamation.findByPk(id);

  if (!reclamation) {
    throw new Error("Reclamation not found");
  }

  await reclamation.destroy();
};

/**
 * =========================
 * 📊 FILTER & SEARCH
 * =========================
 */

// Filter by status
export const getReclamationsByStatusSvc = async (status) => {
  return await Reclamation.findAll({
    where: { status },
    order: [["createdAt", "DESC"]],
  });
};

// Advanced search
export const searchReclamationsSvc = async (query) => {
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

  // 🔎 Keyword search
  if (keyword) {
    where[Op.or] = [
      { subject: { [Op.iLike]: `%${keyword}%` } },
      { message: { [Op.iLike]: `%${keyword}%` } },
    ];
  }

  // Filters
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (vehicleId) where.vehicleId = vehicleId;

  // Date range
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

/**
 * =========================
 * 📎 FILE UPLOAD
 * =========================
 */

export const uploadAttachmentSvc = async (id, file) => {
  const reclamation = await Reclamation.findByPk(id);

  if (!reclamation) {
    throw new Error("Reclamation not found");
  }

  // Example: store file path
  const filePath = file?.path;

  await reclamation.update({
    attachment: filePath, // make sure column exists
  });

  return reclamation;
};