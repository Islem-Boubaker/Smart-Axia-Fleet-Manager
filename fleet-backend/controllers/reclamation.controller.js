import { StatusCodes } from 'http-status-codes';
import * as reclamationService from '../services/reclamation.service.js';
import { uploadReclamationImages } from '../middlewares/upload.js';

export const createVehicleReclamation = [
  uploadReclamationImages.array('images', 5),
  async (req, res, next) => {
    try {
      const { vehicleId, subject, message } = req.body;
      const data = await reclamationService.createVehicleReclamationSvc(
        req.user.id,
        vehicleId,
        subject,
        message,
        req.files
      );
      res.status(StatusCodes.CREATED).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
];

export const createReclamation = async (req, res, next) => {
  try {
    const { subject, message } = req.body;

    const result = await reclamationService.createReclamationSvc(req.user.id, subject, message);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Reclamation created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyReclamations = async (req, res, next) => {
  try {
    const result = await reclamationService.getUserReclamationsSvc(req.user.id, req.query);

    res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyReclamationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await reclamationService.getMyReclamationByIdSvc(req.user.id, id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyReclamation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await reclamationService.updateMyReclamationSvc(req.user.id, id, req.body);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Reclamation updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMyReclamation = async (req, res, next) => {
  try {
    const { id } = req.params;

    await reclamationService.deleteMyReclamationSvc(req.user.id, id);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Reclamation deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

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

export const updateReclamationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await reclamationService.updateReclamationStatusSvc(id, status);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Reclamation status updated',
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
      message: 'Reclamation deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getReclamationsByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;

    const result = await reclamationService.getReclamationsByStatusSvc(status);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

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

export const uploadAttachmentCtrl = [
  uploadReclamationImages.array('images', 5),
  async (req, res, next) => {
    try {
      const data = await reclamationService.uploadAttachmentSvc(req.params.id, req.files);
      res.status(StatusCodes.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
];


export const uploadAttachment = uploadAttachmentCtrl;
