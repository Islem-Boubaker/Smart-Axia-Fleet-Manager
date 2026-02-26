import Vehicle from '../models/vehicle.model.js';
import Reclamation from '../models/reclamation.model.js';

export const createVehicle = async (data) => {
    return await Vehicle.create(data);
};

export const getAllVehicles = async () => {
    return await Vehicle.findAll();
};

export const getVehicleById = async (id) => {
    return await Vehicle.findByPk(id);
};

export const updateVehicle = async (id, data) => {
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) return null;
    return await vehicle.update(data);
};


export const deleteVehicle = async (id) => {
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) return null;

  
    await Reclamation.destroy({ where: { vehicleId: id } });

    await vehicle.destroy();
    return true;
};
