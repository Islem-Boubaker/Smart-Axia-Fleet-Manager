import express from "express";
import * as maintenanceController from "../controllers/maintenance.controller.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.middlewares.js";
import csrfMiddleware from "../middlewares/csrf.middleware.js";
import {
  validateCreateMaintenance,
  validateUpdateMaintenance,
  validateStatusUpdate,
  validateListMaintenancesQuery,
  validateUpcomingQuery,
  validateOverdueQuery,
} from "../validators/maintenance.validator.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/maintenances/upcoming",
  authorizeRoles("ADMIN", "MANAGER", "DRIVER"),
  validateUpcomingQuery,
  maintenanceController.getUpcomingMaintenances
);

router.get(
  "/maintenances/overdue",
  authorizeRoles("ADMIN", "MANAGER"),
  validateOverdueQuery,
  maintenanceController.getOverdueMaintenances
);

router.post(
  "/maintenances",
  authorizeRoles("ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  validateCreateMaintenance,
  maintenanceController.createMaintenance
);

router.get(
  "/maintenances",
  authorizeRoles("ADMIN", "MANAGER", "DRIVER"),
  validateListMaintenancesQuery,
  maintenanceController.getAllMaintenances
);

router.get(
  "/maintenances/:id",
  authorizeRoles("ADMIN", "MANAGER", "DRIVER"),
  maintenanceController.getMaintenanceById
);

router.patch(
  "/maintenances/:id",
  authorizeRoles("ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  validateUpdateMaintenance,
  maintenanceController.updateMaintenance
);

router.delete(
  "/maintenances/:id",
  authorizeRoles("ADMIN"),
  csrfMiddleware.verifyCsrf,
  maintenanceController.deleteMaintenance
);

router.patch(
  "/maintenances/:id/status",
  authorizeRoles("ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  validateStatusUpdate,
  maintenanceController.updateStatus
);

router.patch(
  "/maintenances/:id/start",
  authorizeRoles("ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  maintenanceController.startMaintenance
);

router.patch(
  "/maintenances/:id/complete",
  authorizeRoles("ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  maintenanceController.completeMaintenance
);

router.patch(
  "/maintenances/:id/cancel",
  authorizeRoles("ADMIN", "MANAGER"),
  csrfMiddleware.verifyCsrf,
  maintenanceController.cancelMaintenance
);

export default router;
