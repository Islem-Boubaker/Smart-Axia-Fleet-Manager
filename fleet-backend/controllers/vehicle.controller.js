import * as vehicleService from '../services/vehicle.service.js';

export const createVehicle = async (req, res, next) => {
    try {
        const vehicle = await vehicleService.createVehicle(req.body);
        res.status(201).json(vehicle);
    } catch (err) {
        next(err);
    }
};

export const getAllVehicles = async (req, res, next) => {
    try {
        const vehicles = await vehicleService.getAllVehicles();
        res.json(vehicles);
    } catch (err) {
        next(err);
    }
};

export const getVehicleById = async (req, res, next ) => {
    try {
        const vehicle = await vehicleService.getVehicleById(req.params.id);
        if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
        res.json(vehicle);
    } catch (err) {
        next(err);
    }
};

export const updateVehicle = async (req, res, next  ) => {
    try {
        const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
        if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
        res.json(vehicle);
    } catch (err) {
        next(err);
    }
};

export const deleteVehicle = async (req, res, next) => {
    try {
        const deleted = await vehicleService.deleteVehicle(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Vehicle not found' });
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (err) {
        next(err);
    }
};
