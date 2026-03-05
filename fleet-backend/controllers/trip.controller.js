import * as tripService from '../services/trip.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const createTrip = async (req, res, next) => {
  try {
    const trip = await tripService.createTrip(req.body, req.user);
    return successResponse(res, trip, 'Trip created');
  } catch (err) {
    next(err);
  }
};

export const listTrips = async (req, res, next) => {
  try {
    const result = await tripService.listTrips(req.query, req.user);
    return successResponse(res, result, 'Trips fetched');
  } catch (err) {
    next(err);
  }
};

export const getTripById = async (req, res, next) => {
  try {
    const trip = await tripService.getTripById(req.params.id, req.user);
    return successResponse(res, trip, 'Trip fetched');
  } catch (err) {
    next(err);
  }
};

export const updateTrip = async (req, res, next) => {
  try {
    const trip = await tripService.updateTrip(req.params.id, req.body, req.user);
    return successResponse(res, trip, 'Trip updated');
  } catch (err) {
    next(err);
  }
};

export const updateTripStatus = async (req, res, next) => {
  try {
    const trip = await tripService.updateTripStatus(req.params.id, req.body.status, req.user);
    return successResponse(res, trip, 'Trip status updated');
  } catch (err) {
    next(err);
  }
};

export const deleteTrip = async (req, res, next) => {
  try {
    await tripService.deleteTrip(req.params.id, req.user);
    return successResponse(res, null, 'Trip deleted');
  } catch (err) {
    next(err);
  }
};