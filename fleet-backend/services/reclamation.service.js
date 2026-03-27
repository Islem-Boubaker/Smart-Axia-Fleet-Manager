import Reclamation from "../models/reclamation.model.js";
import { getPagination, getPagingData } from '../utils/pagination.js';

/**
 * Create vehicle reclamation
 */
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

/**
 * Get all reclamations (Admin)
 */
export const getAllReclamationsSvc = async (query = {}) => {
  const { page, limit, offset } = getPagination(query);
  const { count, rows } = await Reclamation.findAndCountAll({
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });
  return getPagingData(count, rows, page, limit);
};

/**
 * Get reclamations by user
 */
export const getUserReclamationsSvc = async (userId, query = {}) => {
  const { page, limit, offset } = getPagination(query);
  const { count, rows } = await Reclamation.findAndCountAll({
    where: { userId },
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });
  return getPagingData(count, rows, page, limit);
};

/**
 * Get reclamations by vehicle
 */
export const getVehicleReclamationsSvc = async (vehicleId, query = {}) => {
  const { page, limit, offset } = getPagination(query);
  const { count, rows } = await Reclamation.findAndCountAll({
    where: { vehicleId },
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });
  return getPagingData(count, rows, page, limit);
};

/**
 * Update reclamation status
 */
export const updateReclamationStatusSvc = async (id, status) => {
  const reclamation = await Reclamation.findByPk(id);

  if (!reclamation) {
    throw new Error("Reclamation not found");
  }

  reclamation.status = status;
  await reclamation.save();

  return reclamation;
};

/**
 * Delete reclamation
 */
export const deleteReclamationSvc = async (id) => {
  const reclamation = await Reclamation.findByPk(id);

  if (!reclamation) {
    throw new Error("Reclamation not found");
  }

  await reclamation.destroy();
};