import express from "express";
import NotificationController from "../controllers/notification.controller.js";
import { authenticate } from "../middlewares/auth.middlewares.js";
import cacheMiddleware from "../middlewares/cache.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/notifications", cacheMiddleware("notifications", "index", { requireAuth: true }), NotificationController.getNotifications);
router.get("/notifications/grouped", cacheMiddleware("notifications", "grouped", { requireAuth: true }), NotificationController.getGroupedNotifications);
router.get("/notifications/unread-count", cacheMiddleware("notifications", "unreadCount", { requireAuth: true }), NotificationController.getUnreadCount);
router.patch("/notifications/read-all", NotificationController.markAllAsRead);
router.get("/notifications/:id", cacheMiddleware("notifications", "show", { requireAuth: true }), NotificationController.getById);
router.patch("/notifications/:id/read", NotificationController.markAsRead);
router.patch("/notifications/:id/archive", NotificationController.archiveNotification);
router.delete("/notifications/:id", NotificationController.deleteNotification);
router.post("/notifications/test", NotificationController.sendTestNotification);

export default router;
