import express from "express";
import * as tripController from "../controllers/trip.controller.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.middlewares.js";
import csrfMiddleware from "../middlewares/csrf.middleware.js";
import checkOwnership from "../middlewares/ownership.middleware.js";
import Trip from "../models/trip.model.js";
import {
  validateCreateTrip,
  validateUpdateTrip,
  validateUpdateStatus,
  validateCompleteTrip,
} from "../validators/trip.validator.js";
import cacheMiddleware from "../middlewares/cache.middleware.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/trips/",
  authorizeRoles("ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  validateCreateTrip,
  tripController.createTrip
);

router.get(
  "/trips/",
  authorizeRoles("ADMIN", "MANAGER", "DRIVER"),
  cacheMiddleware("trips", "index", { requireAuth: true }),
  tripController.getTrips
);

router.get(
  "/trips/:id",
  authorizeRoles("ADMIN", "MANAGER", "DRIVER"),
  checkOwnership(Trip, { ownerField: "userId" }),
  cacheMiddleware("trips", "show", { requireAuth: true }),
  tripController.getTripById
);

router.patch(
  "/trips/:id",
  authorizeRoles("ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  validateUpdateTrip,
  tripController.updateTrip
);

router.delete(
  "/trips/:id",
  authorizeRoles("ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  tripController.deleteTrip
);

router.patch(
  "/trips/:id/status",
  authorizeRoles("ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  validateUpdateStatus,
  tripController.updateTripStatus
);

router.patch(
  "/trips/:id/start",
  authorizeRoles("ADMIN", "MANAGER", "DRIVER"),
  csrfMiddleware.verifyCsrf,
  tripController.startTrip
);

router.patch(
  "/trips/:id/complete",
  authorizeRoles("ADMIN", "MANAGER", "DRIVER"),
  csrfMiddleware.verifyCsrf,
  validateCompleteTrip,
  tripController.completeTrip
);

router.patch(
  "/trips/:id/cancel",
  authorizeRoles("ADMIN", "MANAGER", "DRIVER"),
  csrfMiddleware.verifyCsrf,
  tripController.cancelTrip
);

router.post(
  "/trips/:id/assign-driver",
  authorizeRoles("ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  tripController.assignDriver
);

router.post(
  "/trips/:id/unassign-driver",
  authorizeRoles("ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  tripController.unassignDriver
);

router.post(
  "/trips/recommendations",
  authorizeRoles("ADMIN", "MANAGER"),
  tripController.getRecommendations
);

export default router;

