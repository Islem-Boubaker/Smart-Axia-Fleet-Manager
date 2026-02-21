import Reclamation from "../models/reclamation.model.js";

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
export const getAllReclamationsSvc = async () => {
  return await Reclamation.findAll({
    order: [["createdAt", "DESC"]],
  });
};

/**
 * Get reclamations by user
 */
export const getUserReclamationsSvc = async (userId) => {
  return await Reclamation.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
  });
};

/**
 * Get reclamations by vehicle
 */
export const getVehicleReclamationsSvc = async (vehicleId) => {
  return await Reclamation.findAll({
    where: { vehicleId },
    order: [["createdAt", "DESC"]],
  });
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