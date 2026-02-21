import express from "express";
import * as reclamationController from "../controllers/reclamation.controller.js";
import * as authMiddleware from "../middlewares/auth.middleware.js";


const router = express.Router();

/**
 * USER ROUTES
 */
router.post(
  "/",
  authMiddleware.authenticate,
  reclamationController.createVehicleReclamation
);

router.get(
  "/my",
  authMiddleware.authenticate,
  reclamationController.getMyReclamations
);

/**
 * ADMIN ROUTES
 */
router.get(
  "/",
  authMiddleware.authenticate,
  authMiddleware.authorizeRoles("ADMIN"),
  reclamationController.getAllReclamations
);

router.patch(
  "/:id/status",
  authMiddleware.authenticate,
  authMiddleware.authorizeRoles("ADMIN"),
  reclamationController.updateReclamationStatus
);

router.delete(
  "/:id",
  authMiddleware.authenticate,
  authMiddleware.authorizeRoles("ADMIN"),
  reclamationController.deleteReclamation
);

export default router;