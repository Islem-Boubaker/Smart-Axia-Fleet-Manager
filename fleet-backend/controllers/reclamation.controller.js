import { StatusCodes } from 'http-status-codes';
import * as reclamationService from '../services/reclamation.service.js';
import { uploadReclamationImages } from '../middlewares/upload.js';
import cacheMiddleware from '../middlewares/cache.middleware.js';

const invalidateReclamationCache = async (id) => {
  await cacheMiddleware.invalidatePattern('reclamations:*');
  if (id) {
    await cacheMiddleware.invalidatePattern(`reclamations:show:id=${id}*`);
    await cacheMiddleware.invalidatePattern(`reclamations:myShow:id=${id}*`);
  }
};

export const createVehicleReclamation = [
  uploadReclamationImages.array('images', 5),
  async (req, res, next) => {
    try {
      const {
        vehicleId,
        subject,
        message,
        type,
        driverName,
        vehicleName,
        vehiclePlate,
        tripId,
        metadata,
        reclamationTypeLabel,
      } = req.body;
      const data = await reclamationService.createVehicleReclamationSvc(
        req.user.id,
        vehicleId,
        subject,
        message,
        req.files,
        {
          type,
          driverName,
          vehicleName,
          vehiclePlate,
          tripId,
          metadata,
          reclamationTypeLabel,
        }
      );
      await invalidateReclamationCache(data?.id);
      res.status(StatusCodes.CREATED).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
];

export const createReclamation = async (req, res, next) => {
  try {
    const result = await reclamationService.createReclamationSvc(req.user.id, req.body);
    await invalidateReclamationCache(result?.id);

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
    const result = await reclamationService.getUserReclamationsSvc(req.user.id, req.query, req.cacheKey);

    const payload = {
      success: true,
      ...result,
    };

    if (req.cacheSet) await req.cacheSet(payload);

    res.status(StatusCodes.OK).json(payload);
  } catch (error) {
    next(error);
  }
};

export const getMyReclamationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await reclamationService.getMyReclamationByIdSvc(req.user.id, id, req.cacheKey);

    const payload = {
      success: true,
      data: result,
    };

    if (req.cacheSet) await req.cacheSet(payload);

    res.status(StatusCodes.OK).json(payload);
  } catch (error) {
    next(error);
  }
};

export const updateMyReclamation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await reclamationService.updateMyReclamationSvc(req.user.id, id, req.body);
    await invalidateReclamationCache(id);

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
    await invalidateReclamationCache(id);

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
    const result = await reclamationService.getAllReclamationsSvc(req.query, req.cacheKey);

    const payload = {
      success: true,
      ...result,
    };

    if (req.cacheSet) await req.cacheSet(payload);

    res.status(StatusCodes.OK).json(payload);
  } catch (error) {
    next(error);
  }
};

export const getReclamationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await reclamationService.getReclamationByIdSvc(id, req.cacheKey);

    const payload = {
      success: true,
      data: result,
    };

    if (req.cacheSet) await req.cacheSet(payload);

    res.status(StatusCodes.OK).json(payload);
  } catch (error) {
    next(error);
  }
};

export const updateReclamationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await reclamationService.updateReclamationStatusSvc(id, status, {
      updatedBy: req.user?.id,
      updatedByRole: req.user?.role,
    });
    await invalidateReclamationCache(id);

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
    await invalidateReclamationCache(id);

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

    const result = await reclamationService.getReclamationsByStatusSvc(status, req.cacheKey);

    const payload = {
      success: true,
      data: result,
    };

    if (req.cacheSet) await req.cacheSet(payload);

    res.status(StatusCodes.OK).json(payload);
  } catch (error) {
    next(error);
  }
};

export const searchReclamations = async (req, res, next) => {
  try {
    const result = await reclamationService.searchReclamationsSvc(req.query, req.cacheKey);

    const payload = {
      success: true,
      ...result,
    };

    if (req.cacheSet) await req.cacheSet(payload);

    res.status(StatusCodes.OK).json(payload);
  } catch (error) {
    next(error);
  }
};

export const uploadAttachmentCtrl = [
  uploadReclamationImages.array('images', 5),
  async (req, res, next) => {
    try {
      const data = await reclamationService.uploadAttachmentSvc(req.params.id, req.files);
      await invalidateReclamationCache(req.params.id);
      res.status(StatusCodes.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
];


export const uploadAttachment = uploadAttachmentCtrl;
