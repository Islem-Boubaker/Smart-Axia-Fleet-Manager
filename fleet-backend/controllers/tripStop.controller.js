import * as tripStopService from "../services/tripStop.service.js";
import { successResponse, errorResponse } from "../utils/response.js";
import cacheMiddleware from "../middlewares/cache.middleware.js";

const handleError = (res, error) => {
  const status = error?.status || error?.statusCode || 500;
  const message = error?.message || "Internal server error";
  const details = {
    code: error?.code || (status === 500 ? "INTERNAL_ERROR" : "ERROR"),
    errors: error?.errors,
  };

  return errorResponse(res, message, status, details);
};

const invalidateTripStopsCache = async (tripId) => {
  await cacheMiddleware.invalidatePattern('tripStops:index:*');
  if (tripId) {
    await cacheMiddleware.invalidatePattern(`tripStops:index:id=${tripId}*`);
    await cacheMiddleware.invalidatePattern(`trips:show:id=${tripId}*`);
  }
  await cacheMiddleware.invalidatePattern("trips:index:*");
};

export const addStops = async (req, res) => {
  try {
    const data = await tripStopService.addStops(req.params.id, req.body);
    await invalidateTripStopsCache(req.params.id);
    return successResponse(res, data, "Stop(s) added", 201);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getStops = async (req, res) => {
  try {
    const data = await tripStopService.getStops(req.params.id, req.user.role, req.user.id, req.cacheKey);
    const payload = { success: true, message: "Stops fetched", data };
    if (req.cacheSet) await req.cacheSet(payload);
    return res.status(200).json(payload);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateStop = async (req, res) => {
  try {
    const data = await tripStopService.updateStop(req.params.id, req.params.stopId, req.body);
    await invalidateTripStopsCache(req.params.id);
    return successResponse(res, data, "Stop updated");
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteStop = async (req, res) => {
  try {
    await tripStopService.deleteStop(req.params.id, req.params.stopId);
    await invalidateTripStopsCache(req.params.id);
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
    await invalidateTripStopsCache(req.params.id);
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
    await invalidateTripStopsCache(req.params.id);
    return successResponse(res, data, "Stop skipped");
  } catch (error) {
    return handleError(res, error);
  }
};

export const reorderStops = async (req, res) => {
  try {
    const data = await tripStopService.reorderStops(req.params.id, req.body.order);
    await invalidateTripStopsCache(req.params.id);
    return successResponse(res, data, "Stops reordered");
  } catch (error) {
    return handleError(res, error);
  }
};
