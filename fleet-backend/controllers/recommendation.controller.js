import * as recommendationService from "../services/recommendation.service.js";
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

const compactDrivers = (drivers = []) =>
  drivers.map((item) => ({
    id: item.driverId,
    name: item.name,
    score: item.score,
  }));

const compactVehicles = (vehicles = []) =>
  vehicles.map((item) => ({
    id: item.vehicleId,
    name: item.name,
    score: item.score,
  }));

export const getDriverRecommendations = async (req, res) => {
  try {
    const { tripId, topN, ...tripInput } = req.body;
    const data = tripId
      ? await recommendationService.recommendDriversForTrip(tripId, { topN })
      : await recommendationService.recommendDriversForTripInput(tripInput, { topN });
    return successResponse(
      res,
      compactDrivers(data.drivers),
      "Driver recommendations generated successfully"
    );
  } catch (error) {
    return handleError(res, error);
  }
};

export const getVehicleRecommendations = async (req, res) => {
  try {
    const { tripId, topN, ...tripInput } = req.body;
    const data = tripId
      ? await recommendationService.recommendVehiclesForTrip(tripId, { topN })
      : await recommendationService.recommendVehiclesForTripInput(tripInput, { topN });
    return successResponse(
      res,
      compactVehicles(data.vehicles),
      "Vehicle recommendations generated successfully"
    );
  } catch (error) {
    return handleError(res, error);
  }
};

export const getAssignmentRecommendations = async (req, res) => {
  try {
    const { tripId, topN, ...tripInput } = req.body;
    const data = tripId
      ? await recommendationService.recommendBestAssignmentForTrip(tripId, { topN })
      : await recommendationService.recommendBestAssignmentForTripInput(tripInput, { topN });
    return successResponse(
      res,
      {
        drivers: compactDrivers(data.drivers),
        vehicles: compactVehicles(data.vehicles),
      },
      "Best assignment recommendation generated"
    );
  } catch (error) {
    return handleError(res, error);
  }
};

export const applyBestRecommendation = async (req, res) => {
  try {
    const { tripId, topN } = req.body;
    const data = await recommendationService.assignRecommendedDriverAndVehicle(tripId, { topN });
    return successResponse(res, data, "Best recommendation applied successfully");
  } catch (error) {
    return handleError(res, error);
  }
};

export const dispatchRecommendations = async (req, res) => {
  const action = String(req.body.action || "assignment").toLowerCase();
  if (action === "drivers") return getDriverRecommendations(req, res);
  if (action === "vehicles") return getVehicleRecommendations(req, res);
  if (action === "apply") return applyBestRecommendation(req, res);
  return getAssignmentRecommendations(req, res);
};

