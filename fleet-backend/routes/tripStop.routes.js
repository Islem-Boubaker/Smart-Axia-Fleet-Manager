import express from "express";
import { authenticate, authorizeRoles } from "../middlewares/auth.middlewares.js";
import csrfMiddleware from "../middlewares/csrf.middleware.js";
import {
  validateAddStops,
  validateReorderStops,
  validateUpdateStop,
  validateReachStop,
  validateSkipStop,
} from "../validators/trip.validator.js";
import * as tripStopController from "../controllers/tripStop.controller.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/trips/:id/stops",
  authorizeRoles("ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  validateAddStops,
  tripStopController.addStops
);

router.get(
  "/trips/:id/stops",
  authorizeRoles("ADMIN", "MANAGER", "DRIVER"),
  tripStopController.getStops
);

router.patch(
  "/trips/:id/stops/reorder",
  authorizeRoles("ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  validateReorderStops,
  tripStopController.reorderStops
);

router.patch(
  "/trips/:id/stops/:stopId",
  authorizeRoles("ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  validateUpdateStop,
  tripStopController.updateStop
);

router.delete(
  "/trips/:id/stops/:stopId",
  authorizeRoles("ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  tripStopController.deleteStop
);

router.patch(
  "/trips/:id/stops/:stopId/reach",
  authorizeRoles("ADMIN", "MANAGER", "DRIVER"),
  csrfMiddleware.verifyCsrf,
  validateReachStop,
  tripStopController.reachStop
);

router.patch(
  "/trips/:id/stops/:stopId/skip",
  authorizeRoles("ADMIN", "MANAGER", "DRIVER"),
  csrfMiddleware.verifyCsrf,
  validateSkipStop,
  tripStopController.skipStop
);

export default router;
