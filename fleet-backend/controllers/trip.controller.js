import * as tripService from "../services/trip.service.js";
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

export const createTrip = async (req, res) => {
  try {
    const trip = await tripService.createTrip(req.body);
    return successResponse(res, trip, "Trip created", 201);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getTrips = async (req, res) => {
  try {
    const result = await tripService.getTrips(req.query, req.query, req.user.role, req.user.id);
    return successResponse(res, result, "Trips fetched");
  } catch (error) {
    return handleError(res, error);
  }
};

export const getTripById = async (req, res) => {
  try {
    const trip = await tripService.getTripById(req.params.id, req.user.role, req.user.id);
    return successResponse(res, trip, "Trip fetched");
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateTrip = async (req, res) => {
  try {
    const trip = await tripService.updateTrip(req.params.id, req.body);
    return successResponse(res, trip, "Trip updated");
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteTrip = async (req, res) => {
  try {
    await tripService.deleteTrip(req.params.id);
    return successResponse(res, null, "Trip deleted");
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateTripStatus = async (req, res) => {
  try {
    const trip = await tripService.updateTripStatus(req.params.id, req.body.status);
    return successResponse(res, trip, "Trip status updated");
  } catch (error) {
    return handleError(res, error);
  }
};

export const startTrip = async (req, res) => {
  try {
    const trip = await tripService.startTrip(req.params.id, req.user.role, req.user.id);
    return successResponse(res, trip, "Trip started");
  } catch (error) {
    return handleError(res, error);
  }
};

export const completeTrip = async (req, res) => {
  try {
    const trip = await tripService.completeTrip(req.params.id, req.user.role, req.user.id, req.body);
    return successResponse(res, trip, "Trip completed");
  } catch (error) {
    return handleError(res, error);
  }
};

export const cancelTrip = async (req, res) => {
  try {
    const trip = await tripService.cancelTrip(req.params.id, req.user.role, req.user.id);
    return successResponse(res, trip, "Trip cancelled");
  } catch (error) {
    return handleError(res, error);
  }
};

export const assignDriver = async (req, res) => {
  try {
    const trip = await tripService.assignDriver(req.params.id, req.body.userId);
    return successResponse(res, trip, "Driver assigned to trip");
  } catch (error) {
    return handleError(res, error);
  }
};

export const unassignDriver = async (req, res) => {
  try {
    const trip = await tripService.unassignDriver(req.params.id);
    return successResponse(res, trip, "Driver unassigned from trip");
  } catch (error) {
    return handleError(res, error);
  }
};
