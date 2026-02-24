import * as vehicleService from '../services/vehicle.service.js';
import { StatusCodes } from 'http-status-codes';

export const createVehicle = async (req, res, next) => {
    try {
        const vehicle = await vehicleService.createVehicle(req.body);
        res.status(StatusCodes.CREATED).json({ success: true, data: vehicle });
    } catch (err) {
        next(err);
    }
};

export const getAllVehicles = async (req, res, next) => {
    try {
        const vehicles = await vehicleService.getAllVehicles();
        res.status(StatusCodes.OK).json({ success: true, data: vehicles });
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

export const updateVehicle = async (req, res, next) => {
    try {
        const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
        if (!vehicle)
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ success: false, message: 'Vehicle not found' });
        res.status(StatusCodes.OK).json({ success: true, data: vehicle });
    } catch (err) {
        next(err);
    }
};

export const deleteVehicle = async (req, res, next) => {
    try {
        const deleted = await vehicleService.deleteVehicle(req.params.id);
        if (!deleted)
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ success: false, message: 'Vehicle not found' });
        res
            .status(StatusCodes.OK)
            .json({ success: true, message: 'Vehicle deleted successfully' });
    } catch (err) {
        next(err);
    }
};
