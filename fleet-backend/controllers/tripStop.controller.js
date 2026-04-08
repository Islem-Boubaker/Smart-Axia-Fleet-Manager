import * as tripStopService from "../services/tripStop.service.js";
import { successResponse, errorResponse } from "../utils/response.js";

const handleError = (res, error) => {
  const status = error?.status || error?.statusCode || 500;
  const message = error?.message || "Internal server error";
  const details = {
    code: error?.code || (status === 500 ? "INTERNAL_ERROR" : "ERROR"),
    errors: error?.errors,
  };

  return errorResponse(res, message, status, details);
};

export const addStops = async (req, res) => {
  try {
    const data = await tripStopService.addStops(req.params.id, req.body);
    return successResponse(res, data, "Stop(s) added", 201);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getStops = async (req, res) => {
  try {
    const data = await tripStopService.getStops(req.params.id, req.user.role, req.user.id);
    return successResponse(res, data, "Stops fetched");
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateStop = async (req, res) => {
  try {
    const data = await tripStopService.updateStop(req.params.id, req.params.stopId, req.body);
    return successResponse(res, data, "Stop updated");
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteStop = async (req, res) => {
  try {
    await tripStopService.deleteStop(req.params.id, req.params.stopId);
    return successResponse(res, null, "Stop deleted");
  } catch (error) {
    return handleError(res, error);
  }
};

export const reachStop = async (req, res) => {
  try {
    const data = await tripStopService.reachStop(
      req.params.id,
      req.params.stopId,
      req.user.role,
      req.user.id,
      req.body.arrivalTime
    );
    return successResponse(res, data, "Stop marked as reached");
  } catch (error) {
    return handleError(res, error);
  }
};

export const skipStop = async (req, res) => {
  try {
    const data = await tripStopService.skipStop(
      req.params.id,
      req.params.stopId,
      req.user.role,
      req.user.id,
      req.body.notes
    );
    return successResponse(res, data, "Stop skipped");
  } catch (error) {
    return handleError(res, error);
  }
};

export const reorderStops = async (req, res) => {
  try {
    const data = await tripStopService.reorderStops(req.params.id, req.body.order);
    return successResponse(res, data, "Stops reordered");
  } catch (error) {
    return handleError(res, error);
  }
};
