import express from 'express';
import * as tripController from '../controllers/trip.controller.js';
import * as auth from '../middlewares/auth.middlewares.js';
import * as tripValidator from '../validators/trip.validator.js';
import checkOwnership from '../middlewares/ownership.middleware.js';
import  Trip  from '../models/trip.model.js';

const router = express.Router();


router.use(auth.authenticate);

 
router.post(
  '/trips',
  auth.authorizeRoles('ADMIN', 'MANAGER'),
  tripValidator.validateCreateTrip,
  tripController.createTrip
);


router.get(
  '/trips',
  auth.authorizeRoles('ADMIN', 'MANAGER', 'DRIVER'),
  checkOwnership(Trip, { ownerField: 'userId' }),
  tripController.listTrips
);

// Get one trip
router.get(
  '/trips/:id',
  auth.authorizeRoles('ADMIN', 'MANAGER', 'DRIVER'),
  checkOwnership(Trip, { ownerField: 'userId' }),
  tripController.getTripById
);

// Update trip (admin/manager)
router.patch(
  '/trips/:id',
  auth.authorizeRoles('ADMIN', 'MANAGER'),
  checkOwnership(Trip, { ownerField: 'userId' }),
  tripValidator.validateUpdateTrip,
  tripController.updateTrip
);


router.patch(
  '/trips/:id/status',
  auth.authorizeRoles('ADMIN', 'MANAGER'),
  checkOwnership(Trip, { ownerField: 'userId' }),
  tripValidator.validateUpdateTripStatus,
  tripController.updateTripStatus
);

// Delete trip (admin/manager)
router.delete(
  '/trips/:id',
  auth.authorizeRoles('ADMIN', 'MANAGER'),
  checkOwnership(Trip, { ownerField: 'userId' }),
  tripController.deleteTrip
);

export default router;