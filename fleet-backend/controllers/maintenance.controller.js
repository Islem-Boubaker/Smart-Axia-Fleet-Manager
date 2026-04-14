import * as maintenanceService from "../services/maintenance.service.js";
import { successResponse, errorResponse } from "../utils/response.js";

const handleError = (res, error) => {
  const status = error?.status || error?.statusCode || 500;
  const message = error?.message || "Internal server error";

  return errorResponse(res, message, status, {
    code: error?.code || "INTERNAL_SERVER_ERROR",
    errors: error?.errors || [],
    ...(error?.data ? { data: error.data } : {}),
  });
};

export const createMaintenance = async (req, res) => {
  try {
    const data = await maintenanceService.createMaintenance(req.body, req.user.id);
    return successResponse(res, data, "Maintenance record created successfully", 201);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getAllMaintenances = async (req, res) => {
  try {
    const query = req.validatedQuery || req.query;
    const data = await maintenanceService.getAllMaintenances(query, req.user.role, req.user.id);
    return successResponse(res, data, "Maintenances fetched");
  } catch (error) {
    return handleError(res, error);
  }
};

export const getMaintenanceById = async (req, res) => {
  try {
    const data = await maintenanceService.getMaintenanceById(req.params.id, req.user.role, req.user.id);
    return successResponse(res, data, "Maintenance fetched");
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateMaintenance = async (req, res) => {
  try {
    const data = await maintenanceService.updateMaintenance(req.params.id, req.body, req.user.id);
    return successResponse(res, data, "Maintenance record updated successfully");
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteMaintenance = async (req, res) => {
  try {
    const data = await maintenanceService.deleteMaintenance(req.params.id);
    return successResponse(res, data, "Maintenance record deleted successfully");
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateStatus = async (req, res) => {
  try {
    const data = await maintenanceService.updateStatus(req.params.id, req.body.status, req.user.id);
    return successResponse(res, data, `Maintenance status updated to ${req.body.status}`);
  } catch (error) {
    return handleError(res, error);
  }
};

export const startMaintenance = async (req, res) => {
  try {
    const data = await maintenanceService.startMaintenance(req.params.id, req.user.id);
    return successResponse(res, data, "Maintenance started successfully");
  } catch (error) {
    return handleError(res, error);
  }
};

export const completeMaintenance = async (req, res) => {
  try {
    const data = await maintenanceService.completeMaintenance(req.params.id, req.user.id, req.body);
    return successResponse(res, data, "Maintenance completed successfully");
  } catch (error) {
    return handleError(res, error);
  }
};

export const cancelMaintenance = async (req, res) => {
  try {
    const data = await maintenanceService.cancelMaintenance(req.params.id, req.user.id);
    return successResponse(res, data, "Maintenance cancelled successfully");
  } catch (error) {
    return handleError(res, error);
  }
};

export const getUpcomingMaintenances = async (req, res) => {
  try {
    const query = req.validatedQuery || req.query;
    const data = await maintenanceService.getUpcomingMaintenances(query);
    return successResponse(res, data, "Upcoming maintenances fetched");
  } catch (error) {
    return handleError(res, error);
  }
};

export const getOverdueMaintenances = async (req, res) => {
  try {
    const query = req.validatedQuery || req.query;
    const data = await maintenanceService.getOverdueMaintenances(query);
    return successResponse(res, data, "Overdue maintenances fetched");
  } catch (error) {
    return handleError(res, error);
  }
};
