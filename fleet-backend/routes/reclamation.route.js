import express from "express";
import * as reclamationController from "../controllers/reclamation.controller.js";
import * as authMiddleware from "../middlewares/auth.middlewares.js";

const router = express.Router();

/**
 * =========================
 * 👤 USER ROUTES
 * =========================
 */

// Create vehicle reclamation
router.post(
  "/reclamations/vehicle",
  authMiddleware.authenticate,
  reclamationController.createVehicleReclamation
);

// Create general reclamation
router.post(
  "/reclamations",
  authMiddleware.authenticate,
  reclamationController.createReclamation
);

// Get my reclamations
router.get(
  "/my/reclamations",
  authMiddleware.authenticate,
  reclamationController.getMyReclamations
);

// Get single reclamation (owner only)
router.get(
  "/my/reclamations/:id",
  authMiddleware.authenticate,
  reclamationController.getMyReclamationById
);

// Update my reclamation (only if not processed)
router.put(
  "/my/reclamations/:id",
  authMiddleware.authenticate,
  reclamationController.updateMyReclamation
);

// Delete my reclamation
router.delete(
  "/my/reclamations/:id",
  authMiddleware.authenticate,
  reclamationController.deleteMyReclamation
);

/**
 * =========================
 * 🛠 ADMIN ROUTES
 * =========================
 */

// Get all reclamations
router.get(
  "/reclamations",
  authMiddleware.authenticate,
  authMiddleware.authorizeRoles("ADMIN"),
  reclamationController.getAllReclamations
);

// Get reclamation by ID
router.get(
  "/reclamations/:id",
  authMiddleware.authenticate,
  authMiddleware.authorizeRoles("ADMIN"),
  reclamationController.getReclamationById
);

// Update status
router.patch(
  "/reclamations/:id/status",
  authMiddleware.authenticate,
  authMiddleware.authorizeRoles("ADMIN"),
  reclamationController.updateReclamationStatus
);



// Delete reclamation
router.delete(
  "/reclamations/:id",
  authMiddleware.authenticate,
  authMiddleware.authorizeRoles("ADMIN"),
  reclamationController.deleteReclamation
);

/**
 * =========================
 * 📊 FILTER & SEARCH
 * =========================
 */

// Filter by status (pending, resolved, rejected)
router.get(
  "/reclamations/status/:status",
  authMiddleware.authenticate,
  authMiddleware.authorizeRoles("ADMIN"),
  reclamationController.getReclamationsByStatus
);

// Search reclamations
router.get(
  "/reclamations/search",
  authMiddleware.authenticate,
  authMiddleware.authorizeRoles("ADMIN"),
  reclamationController.searchReclamations
);



router.post(
  "/reclamations/:id/upload",
  authMiddleware.authenticate,
  reclamationController.uploadAttachment
);



export default router;