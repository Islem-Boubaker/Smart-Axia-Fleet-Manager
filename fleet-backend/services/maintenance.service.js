import Maintenance from '../models/maintenance.model.js';
import { getPagination, getPagingData } from '../utils/pagination.js';


// CREATE
export const createMaintenanceService = async (data) => {
    return await Maintenance.create(data);
};


// GET ALL
export const getAllMaintenancesService = async (query = {}) => {
    const { page, limit, offset } = getPagination(query);
    const { count, rows } = await Maintenance.findAndCountAll({
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });
    return getPagingData(count, rows, page, limit);
};


// GET BY ID
export const getMaintenanceByIdService = async (id) => {
    return await Maintenance.findByPk(id);
};


// UPDATE
export const updateMaintenanceService = async (id, data) => {

    const maintenance = await Maintenance.findByPk(id);

    if (!maintenance) return null;

    await maintenance.update(data);

    return maintenance;
};


// DELETE
export const deleteMaintenanceService = async (id) => {

    const maintenance = await Maintenance.findByPk(id);

    if (!maintenance) return null;

    await maintenance.destroy();

    return true;
};


// UPDATE STATUS
export const updateMaintenanceStatusService = async (id, status) => {

    const maintenance = await Maintenance.findByPk(id);

    if (!maintenance) return null;

    await maintenance.update({ status });

    return maintenance;
};