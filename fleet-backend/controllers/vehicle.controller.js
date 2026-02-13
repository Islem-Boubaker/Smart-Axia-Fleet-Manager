import * as vehicleService from '../services/vehicle.service.js';

export const createVehicle = async (req, res) => {
    try {
        const vehicle = await vehicleService.createVehicle(req.body);
        res.status(201).json(vehicle);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const getAllVehicles = async (req, res) => {
    try {
        const vehicles = await vehicleService.getAllVehicles();
        res.json(vehicles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getVehicleById = async (req, res) => {
    try {
        const vehicle = await vehicleService.getVehicleById(req.params.id);
        if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
        res.json(vehicle);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateVehicle = async (req, res) => {
    try {
        const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
        if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
        res.json(vehicle);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const deleteVehicle = async (req, res) => {
    try {
        const deleted = await vehicleService.deleteVehicle(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Vehicle not found' });
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
