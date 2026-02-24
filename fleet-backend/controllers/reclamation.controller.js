import { StatusCodes } from "http-status-codes";
import * as reclamationService from "../services/reclamation.service.js";


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


export const getAllReclamations = async (req, res, next) => {
  try {
    const result = await reclamationService.getAllReclamationsSvc();

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


export const getMyReclamations = async (req, res, next) => {
  try {
    const result = await reclamationService.getUserReclamationsSvc(
      req.user.id
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


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