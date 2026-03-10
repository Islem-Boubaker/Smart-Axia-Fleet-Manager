import express from "express";
import * as tripController from "../controllers/trip.controller.js";
import * as auth from "../middlewares/auth.middlewares.js";
import * as tripValidator from "../validators/trip.validator.js";
import checkOwnership from "../middlewares/ownership.middleware.js";
import Trip from "../models/trip.model.js";
import csrfMiddleware from "../middlewares/csrf.middleware.js";

const router = express.Router();

router.use(auth.authenticate);


router.post(
  "/trips",
  auth.authorizeRoles("ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  tripValidator.validateCreateTrip,
  tripValidator.validateVehicleExists,
  tripValidator.validateDriverExists,
  tripValidator.validateTripTimeLogic,
  tripValidator.validateNoOverlappingVehicleTrip,
  tripValidator.validateNoOverlappingDriverTrip,
  tripController.createTrip
);


router.get(
  "/trips",
  auth.authorizeRoles("ADMIN", "MANAGER", "DRIVER"),
  tripController.listTrips
);

router.get(
  "/trips/:id",
  auth.authorizeRoles("ADMIN", "MANAGER", "DRIVER"),
  checkOwnership(Trip, { ownerField: "userId" }),
  tripController.getTripById
);


router.patch(
  "/trips/:id",
  auth.authorizeRoles("ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  checkOwnership(Trip, { ownerField: "userId" }),
  tripValidator.validateUpdateTrip,
  tripValidator.validateVehicleExists,
  tripValidator.validateDriverExists,
  tripValidator.validateTripTimeLogic,
  tripValidator.validateNoOverlappingVehicleTrip,
  tripValidator.validateNoOverlappingDriverTrip,
  tripController.updateTrip
);


router.patch(
  "/trips/:id/status",
  auth.authorizeRoles("ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  checkOwnership(Trip, { ownerField: "userId" }),
  tripValidator.validateUpdateTripStatus,
  tripValidator.validateTripStatusTransition,
  tripController.updateTripStatus
);


router.delete(
  "/trips/:id",
  auth.authorizeRoles("ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  checkOwnership(Trip, { ownerField: "userId" }),
  tripController.deleteTrip
);


router.post(
  "/trips/:id/assign-driver",
  auth.authorizeRoles("ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  tripValidator.validateDriverExists,
  tripController.assignDriverToTrip
);

router.post(
  "/trips/:id/unassign-driver",
  auth.authorizeRoles("ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  tripController.unassignDriverFromTrip
);

router.patch(
  "/trips/:id/start",
  auth.authorizeRoles("DRIVER", "ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  checkOwnership(Trip, { ownerField: "userId" }),
  tripController.startTrip
);

router.patch(
  "/trips/:id/complete",
  auth.authorizeRoles("DRIVER", "ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  checkOwnership(Trip, { ownerField: "userId" }),
  tripController.completeTrip
);

router.patch(
  "/trips/:id/cancel",
  auth.authorizeRoles("DRIVER", "ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  checkOwnership(Trip, { ownerField: "userId" }),
  tripController.cancelTrip
);


router.get(
  "/trips/:id/live-location",
  auth.authorizeRoles("ADMIN", "MANAGER", "DRIVER"),
  checkOwnership(Trip, { ownerField: "userId" }),
  tripController.getLiveLocation
);

router.post(
  "/trips/:id/location-pings",
  auth.authorizeRoles("DRIVER"),
  csrfMiddleware.verifyCsrf,
  checkOwnership(Trip, { ownerField: "userId" }),
  tripController.recordLocationPing
);

router.get(
  "/trips/:id/history",
  auth.authorizeRoles("ADMIN", "MANAGER", "DRIVER"),
  checkOwnership(Trip, { ownerField: "userId" }),
  tripController.getTripHistory
);

export default router;