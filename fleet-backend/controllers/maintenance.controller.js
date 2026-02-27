import {
    createMaintenanceService,
    getAllMaintenancesService,
    getMaintenanceByIdService,
    updateMaintenanceService,
    deleteMaintenanceService,
    updateMaintenanceStatusService
} from '../services/maintenance.service.js';

import { successResponse, errorResponse } from '../utils/response.js';


// CREATE
export const createMaintenance = async (req, res) => {

    try {

        const maintenance = await createMaintenanceService(req.body);

        return successResponse(
            res,
            maintenance,
            'Maintenance created',
            201
        );

    } catch (error) {

        return errorResponse(res, error.message);

    }
};



// GET ALL
export const getAllMaintenances = async (req, res) => {

    try {

        const maintenances = await getAllMaintenancesService();

        return successResponse(
            res,
            maintenances,
            'Maintenances fetched'
        );

    } catch (error) {

        return errorResponse(res, error.message);

    }
};



// GET BY ID
export const getMaintenanceById = async (req, res) => {

    try {

        const maintenance = await getMaintenanceByIdService(req.params.id);

        if (!maintenance)
            return errorResponse(res, 'Maintenance not found', 404);

        return successResponse(res, maintenance);

    } catch (error) {

        return errorResponse(res, error.message);

    }
};



// UPDATE
export const updateMaintenance = async (req, res) => {

    try {

        const maintenance = await updateMaintenanceService(
            req.params.id,
            req.body
        );

        if (!maintenance)
            return errorResponse(res, 'Maintenance not found', 404);

        return successResponse(
            res,
            maintenance,
            'Maintenance updated'
        );

    } catch (error) {

        return errorResponse(res, error.message);

    }
};



// DELETE
export const deleteMaintenance = async (req, res) => {

    try {

        const deleted = await deleteMaintenanceService(req.params.id);

        if (!deleted)
            return errorResponse(res, 'Maintenance not found', 404);

        return successResponse(
            res,
            null,
            'Maintenance deleted'
        );

    } catch (error) {

        return errorResponse(res, error.message);

    }
};



// UPDATE STATUS
export const updateMaintenanceStatus = async (req, res) => {

    try {

        const { status } = req.body;

        const maintenance =
            await updateMaintenanceStatusService(
                req.params.id,
                status
            );

        if (!maintenance)
            return errorResponse(res, 'Maintenance not found', 404);

        return successResponse(
            res,
            maintenance,
            'Status updated'
        );

    } catch (error) {

        return errorResponse(res, error.message);

    }
};