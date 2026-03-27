import * as tripService from "../services/trip.service.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const createTrip = async (req, res, next) => {
  try {
    const trip = await tripService.createTrip(req.body, req.user);
    return successResponse(res, trip, "Trip created");
  } catch (err) {
    next(err);
  }
};

export const listTrips = async (req, res, next) => {
  try {
    const result = await tripService.listTrips(req.query, req.user);
    return res.status(200).json({ success: true, message: "Trips fetched", ...result });
  } catch (err) {
    next(err);
  }
};

export const getTripById = async (req, res, next) => {
  try {
    const trip = await tripService.getTripById(req.params.id, req.user);
    return successResponse(res, trip, "Trip fetched");
  } catch (err) {
    next(err);
  }
};

export const updateTrip = async (req, res, next) => {
  try {
    const trip = await tripService.updateTrip(req.params.id, req.body, req.user);
    return successResponse(res, trip, "Trip updated");
  } catch (err) {
    next(err);
  }
};

export const updateTripStatus = async (req, res, next) => {
  try {
    const trip = await tripService.updateTripStatus(
      req.params.id,
      req.body.status,
      req.user
    );
    return successResponse(res, trip, "Trip status updated");
  } catch (err) {
    next(err);
  }
};

export const deleteTrip = async (req, res, next) => {
  try {
    await tripService.deleteTrip(req.params.id, req.user);
    return successResponse(res, null, "Trip deleted");
  } catch (err) {
    next(err);
  }
};

/**
 * Assign driver to trip
 * body: { userId: "driver-uuid" }
 */
export const assignDriverToTrip = async (req, res, next) => {
  try {
    const trip = await tripService.assignDriverToTrip(
      req.params.id,
      req.body.userId,
      req.user
    );
    return successResponse(res, trip, "Driver assigned to trip");
  } catch (err) {
    next(err);
  }
};

/**
 * Unassign driver from trip
 */
export const unassignDriverFromTrip = async (req, res, next) => {
  try {
    const trip = await tripService.unassignDriverFromTrip(
      req.params.id,
      req.user
    );
    return successResponse(res, trip, "Driver unassigned from trip");
  } catch (err) {
    next(err);
  }
};

/**
 * Start trip
 */
export const startTrip = async (req, res, next) => {
  try {
    const trip = await tripService.startTrip(req.params.id, req.user);
    return successResponse(res, trip, "Trip started");
  } catch (err) {
    next(err);
  }
};

/**
 * Complete trip
 * optional body can contain:
 * {
 *   endTime,
 *   cost,
 *   fuel
 * }
 */
export const completeTrip = async (req, res, next) => {
  try {
    const trip = await tripService.completeTrip(
      req.params.id,
      req.body,
      req.user
    );
    return successResponse(res, trip, "Trip completed");
  } catch (err) {
    next(err);
  }
};

/**
 * Cancel trip
 */
export const cancelTrip = async (req, res, next) => {
  try {
    const trip = await tripService.cancelTrip(req.params.id, req.user);
    return successResponse(res, trip, "Trip cancelled");
  } catch (err) {
    next(err);
  }
};

/**
 * Get live location of a trip
 */
export const getLiveLocation = async (req, res, next) => {
  try {
    const location = await tripService.getLiveLocation(req.params.id, req.user);
    return successResponse(res, location, "Live location fetched");
  } catch (err) {
    next(err);
  }
};

/**
 * Record location ping for a trip
 * body example:
 * {
 *   latitude: 36.8065,
 *   longitude: 10.1815,
 *   speed: 60,
 *   recordedAt: "2026-01-10T10:00:00.000Z"
 * }
 */
export const recordLocationPing = async (req, res, next) => {
  try {
    const ping = await tripService.recordLocationPing(
      req.params.id,
      req.body,
      req.user
    );
    return successResponse(res, ping, "Location ping recorded");
  } catch (err) {
    next(err);
  }
};


export const getTripHistory = async (req, res, next) => {
  try {
    const history = await tripService.getTripHistory(req.params.id, req.user);
    return successResponse(res, history, "Trip history fetched");
  } catch (err) {
    next(err);
  }
};