import { StatusCodes } from "http-status-codes";
import * as reclamationService from "../services/reclamation.service.js";

/**
 * =========================
 * 👤 USER CONTROLLERS
 * =========================
 */

// Create vehicle reclamation
export const createVehicleReclamation = async (req, res, next) => {
  try {
    const { vehicleId, subject, message } = req.body;

    const result = await reclamationService.createVehicleReclamationSvc(
      req.user.id,
      vehicleId,
      subject,
      message
    );

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Vehicle reclamation submitted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Create general reclamation
export const createReclamation = async (req, res, next) => {
  try {
    const { subject, message, vehicleId } = req.body;

    const result = await reclamationService.createReclamationSvc(
      req.user.id,
      subject,
      message,
      vehicleId
    );

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Reclamation created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get my reclamations
export const getMyReclamations = async (req, res, next) => {
  try {
    const result = await reclamationService.getUserReclamationsSvc(
      req.user.id,
      req.query
    );

    res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// Get single reclamation (owner)
export const getMyReclamationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await reclamationService.getMyReclamationByIdSvc(
      req.user.id,
      id
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Update my reclamation
export const updateMyReclamation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await reclamationService.updateMyReclamationSvc(
      req.user.id,
      id,
      req.body
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Reclamation updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Delete my reclamation
export const deleteMyReclamation = async (req, res, next) => {
  try {
    const { id } = req.params;

    await reclamationService.deleteMyReclamationSvc(req.user.id, id);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Reclamation deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================
 * 🛠 ADMIN CONTROLLERS
 * =========================
 */

// Get all reclamations
export const getAllReclamations = async (req, res, next) => {
  try {
    const result = await reclamationService.getAllReclamationsSvc(req.query);

    res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// Get reclamation by ID
export const getReclamationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await reclamationService.getReclamationByIdSvc(id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Update status
export const updateReclamationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result =
      await reclamationService.updateReclamationStatusSvc(id, status);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Reclamation status updated",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Delete (admin)
export const deleteReclamation = async (req, res, next) => {
  try {
    const { id } = req.params;

    await reclamationService.deleteReclamationSvc(id);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Reclamation deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================
 * 📊 FILTER & SEARCH
 * =========================
 */

// Filter by status
export const getReclamationsByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;

    const result =
      await reclamationService.getReclamationsByStatusSvc(status);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Search (delegates to service)
export const searchReclamations = async (req, res, next) => {
  try {
    const result = await reclamationService.searchReclamationsSvc(req.query);

    res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================
 * 📎 FILE UPLOAD
 * =========================
 */

export const uploadAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await reclamationService.uploadAttachmentSvc(
      id,
      req.file // assuming multer
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "File uploaded successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};