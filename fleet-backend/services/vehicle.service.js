import Vehicle from '../models/vehicle.model.js';
import Reclamation from '../models/reclamation.model.js';
import { getPagination, getPagingData } from '../utils/pagination.js';

export const createVehicle = async (data) => {
    return await Vehicle.create(data);
};

export const getAllVehicles = async (query = {}) => {
    const { page, limit, offset } = getPagination(query);
    const { count, rows } = await Vehicle.findAndCountAll({
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });
    return getPagingData(count, rows, page, limit);
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
