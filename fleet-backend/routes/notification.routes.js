import express from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import * as authmiddlewares from '../middlewares/auth.middlewares.js';
import checkOwnership from '../middlewares/ownership.middleware.js';
import csrfMiddleware from '../middlewares/csrf.middleware.js';
import Notification from '../models/notification.model.js';

const router = express.Router();

router.use(authmiddlewares.authenticate);

router.post(
  '/notification/',
  authmiddlewares.authorizeRoles('ADMIN', 'MANAGER'),
  csrfMiddleware.verifyCsrf,
  notificationController.createNotification
);

router.get(
  '/notification/',
  authmiddlewares.authorizeRoles('ADMIN', 'MANAGER', 'DRIVER'),
  notificationController.getAllNotifications
);

router.get(
  '/notification/:notificationId',
  authmiddlewares.authorizeRoles('ADMIN', 'MANAGER', 'DRIVER'),
  checkOwnership(Notification, { ownerField: 'userId' }),
  notificationController.getNotificationById
);

router.put(
  '/notification/:notificationId',
  authmiddlewares.authorizeRoles('ADMIN', 'MANAGER'),
  csrfMiddleware.verifyCsrf,
  checkOwnership(Notification, { ownerField: 'userId' }),
  notificationController.updateNotification
);

router.delete(
  '/notification/:notificationId',
  authmiddlewares.authorizeRoles('ADMIN', 'MANAGER', 'DRIVER'),
  csrfMiddleware.verifyCsrf,
  checkOwnership(Notification, { ownerField: 'userId' }),
  notificationController.deleteNotification
);

router.patch(
  '/notification/:notificationId/read',
  authmiddlewares.authorizeRoles('ADMIN', 'MANAGER', 'DRIVER'),
  csrfMiddleware.verifyCsrf,
  checkOwnership(Notification, { ownerField: 'userId' }),
  notificationController.markAsRead
);

router.patch(
  '/notification/read-all',
  authmiddlewares.authorizeRoles('ADMIN', 'MANAGER', 'DRIVER'),
  csrfMiddleware.verifyCsrf,
  notificationController.markAllAsRead
);

router.get(
  '/notification/unread-count',
  authmiddlewares.authorizeRoles('ADMIN', 'MANAGER', 'DRIVER'),
  notificationController.getUnreadCount
);

router.delete(
  '/notification/clear-read',
  authmiddlewares.authorizeRoles('ADMIN', 'MANAGER', 'DRIVER'),
  csrfMiddleware.verifyCsrf,
  notificationController.clearReadNotifications
);

export default router;