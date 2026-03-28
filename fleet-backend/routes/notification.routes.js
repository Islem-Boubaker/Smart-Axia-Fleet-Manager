import express from "express";
import NotificationController from "../controllers/notification.controller.js";
import { authenticate } from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(authenticate);

router.get("/notifications", NotificationController.getNotifications);
router.get("/notifications/grouped", NotificationController.getGroupedNotifications);
router.get("/notifications/unread-count", NotificationController.getUnreadCount);
router.patch("/notifications/read-all", NotificationController.markAllAsRead);
router.get("/notifications/:id", NotificationController.getById);
router.patch("/notifications/:id/read", NotificationController.markAsRead);
router.patch("/notifications/:id/archive", NotificationController.archiveNotification);
router.delete("/notifications/:id", NotificationController.deleteNotification);
router.post("/notifications/test", NotificationController.sendTestNotification);

export default router;
