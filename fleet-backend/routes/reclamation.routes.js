import express from "express";
import * as reclamationController from "../controllers/reclamation.controller.js";
import * as authMiddleware from "../middlewares/auth.middlewares.js";
import cacheMiddleware from "../middlewares/cache.middleware.js";

const router = express.Router();

/**
 * =========================
 * 👤 USER ROUTES
 * =========================
 */



// Backward-compatible route
router.post(
  "/reclamations/vehicle",
  authMiddleware.authenticate,
  ...reclamationController.createVehicleReclamation
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
  cacheMiddleware("reclamations", "myIndex", { requireAuth: true }),
  reclamationController.getMyReclamations
);

// Get single reclamation (owner only)
router.get(
  "/my/reclamations/:id",
  authMiddleware.authenticate,
  cacheMiddleware("reclamations", "myShow", { requireAuth: true }),
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
  authMiddleware.authorizeRoles("ADMIN", "MANAGER"),
  cacheMiddleware("reclamations", "index", { requireAuth: true }),
  reclamationController.getAllReclamations
);

// Get reclamation by ID
router.get(
  "/reclamations/:id",
  authMiddleware.authenticate,
  authMiddleware.authorizeRoles("ADMIN", "MANAGER"),
  cacheMiddleware("reclamations", "show", { requireAuth: true }),
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
  authMiddleware.authorizeRoles("ADMIN", "MANAGER"),
  cacheMiddleware("reclamations", "byStatus", { requireAuth: true }),
  reclamationController.getReclamationsByStatus
);

// Search reclamations
router.get(
  "/reclamations/search",
  authMiddleware.authenticate,
  authMiddleware.authorizeRoles("ADMIN", "MANAGER"),
  cacheMiddleware("reclamations", "search", { requireAuth: true }),
  reclamationController.searchReclamations
);


router.put(
  "/:id/attachments",
  authMiddleware.authenticate,
  ...reclamationController.uploadAttachmentCtrl
);

// Backward-compatible route
router.post(
  "/reclamations/:id/upload",
  authMiddleware.authenticate,
  ...reclamationController.uploadAttachmentCtrl
);


export default router;