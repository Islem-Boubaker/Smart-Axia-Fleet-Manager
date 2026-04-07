import { StatusCodes } from 'http-status-codes';
import * as vehicleService from '../services/vehicle.service.js';
import { uploadVehiclePhotos } from '../middlewares/upload.js';

// ─────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────

// POST /vehicle/addvehicle  — with optional photo
export const createVehicle = [
  uploadVehiclePhotos.array('photos', 5),
  async (req, res, next) => {
    try {
      const data = { ...req.body };

      // Map uploaded files to Cloudinary URLs
      if (req.files?.length) {
        data.photos = req.files.map((f) => f.path);
      }

      const vehicle = await vehicleService.createVehicle(data);
      res.status(StatusCodes.CREATED).json({ success: true, data: vehicle });
    } catch (err) {
      console.error('[createVehicle]', err.message, err.errors ?? '');
      next(err);
    }
  },
];

export const getAllVehicles = async (req, res, next) => {
  try {
    const result = await vehicleService.getAllVehicles(req.query);
    res.status(StatusCodes.OK).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.getVehicleById(req.params.id);
    if (!vehicle)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: 'Vehicle not found' });

    res.status(StatusCodes.OK).json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
};

// PUT /vehicle/updatevehicle/:id  — with optional photo update
export const updateVehicle = [
  uploadVehiclePhotos.array('photos', 5),
  async (req, res, next) => {
    try {
      const data = { ...req.body };

      if (req.files?.length) {
        data.photos = req.files.map((f) => f.path);
      }
      
      console.log('[updateVehicle] data:', data);

      const vehicle = await vehicleService.updateVehicle(req.params.id, data);
      if (!vehicle)
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ success: false, message: 'Vehicle not found' });

      res.status(StatusCodes.OK).json({ success: true, data: vehicle });
    } catch (err) {
      console.error('[updateVehicle]', err.message, err.errors ?? '');
      next(err);
    }
  },
];

export const deleteVehicle = async (req, res, next) => {
  try {
    const deleted = await vehicleService.deleteVehicle(req.params.id);
    if (!deleted)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: 'Vehicle not found' });

    res.status(StatusCodes.OK).json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// Driver assignment
// ─────────────────────────────────────────────

export const assignDriver = async (req, res, next) => {
  try {
    const { driverId, tripId } = req.body;

    if (!driverId)
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: 'driverId is required' });

    const vehicle = await vehicleService.updateVehicle(req.params.id, {
      driverId,
      tripId: tripId ?? null,
    });

    if (!vehicle)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: 'Vehicle not found' });

    res.status(StatusCodes.OK).json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
};

export const unassignDriver = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.updateVehicle(req.params.id, {
      driverId: null,
      tripId: req.body?.tripId ?? null,
    });

    if (!vehicle)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: 'Vehicle not found' });

    res.status(StatusCodes.OK).json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// Idle check
// ─────────────────────────────────────────────

export const checkIdleVehicles = async (req, res, next) => {
  try {
    const threshold = Number(req.body?.thresholdMinutes) || 30;
    await vehicleService.checkIdleVehicles(threshold);
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Idle check completed (threshold: ${threshold} min)`,
    });
  } catch (err) {
    next(err);
  }
};