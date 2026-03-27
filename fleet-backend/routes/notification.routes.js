import express from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import * as authmiddlewares from '../middlewares/auth.middlewares.js';
import checkOwnership from '../middlewares/ownership.middleware.js';
import csrfMiddleware from '../middlewares/csrf.middleware.js';
import Notification from '../models/notification.model.js';

const router = express.Router();

router.use(authmiddlewares.authenticate);
router.use(authmiddlewares.authorizeRoles('ADMIN', 'MANAGER', 'DRIVER'));


router.post(
  '/notification/',
  csrfMiddleware.verifyCsrf,
  notificationController.createNotification
);


router.get(
  '/notifications/',
  notificationController.getAllNotifications
);


router.get(
  '/notification/type/:type',
  notificationController.getNotificationsByType
);


router.get(
  '/notification/unread-count',
  notificationController.getUnreadCount
);

router.patch(
  '/notification/read-all',
  csrfMiddleware.verifyCsrf,
  notificationController.markAllAsRead
);


router.delete(
  '/notification/clear-read',
  csrfMiddleware.verifyCsrf,
  notificationController.clearReadNotifications
);


router.delete(
  '/notification/clear-all',
  csrfMiddleware.verifyCsrf,
  notificationController.clearAllNotifications
);


router.get(
  '/notification/:notificationId',
  checkOwnership(Notification, { ownerField: 'userId' }),
  notificationController.getNotificationById
);


router.put(
  '/notification/:notificationId',
  csrfMiddleware.verifyCsrf,
  checkOwnership(Notification, { ownerField: 'userId' }),
  notificationController.updateNotification
);


router.delete(
  '/notification/:notificationId',
  csrfMiddleware.verifyCsrf,
  checkOwnership(Notification, { ownerField: 'userId' }),
  notificationController.deleteNotification
);


router.patch(
  '/notification/:notificationId/read',
  csrfMiddleware.verifyCsrf,
  checkOwnership(Notification, { ownerField: 'userId' }),
  notificationController.markAsRead
);


router.patch(
  '/notification/:notificationId/unread',
  csrfMiddleware.verifyCsrf,
  checkOwnership(Notification, { ownerField: 'userId' }),
  notificationController.markAsUnread
);

export default router;