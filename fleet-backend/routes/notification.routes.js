import express from 'express';
import {
  createNotification,
  getAllNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  markAsRead
} from '../controllers/notification.controller.js';
import { checkOwnership } from '../middlewares/ownership.middleware.js';
const router = express.Router();



router.post('/notifications/', createNotification);



router.get('/notifications/',checkOwnership(Notification, { ownerField: 'userId' }), getAllNotifications);



router.get('/notifications/:notificationId', checkOwnership(Notification, { ownerField: 'userId' }), getNotificationById);



router.put('/notifications/:notificationId', updateNotification);



router.delete('/notifications/:notificationId', checkOwnership(Notification, { ownerField: 'userId' }), deleteNotification);


router.patch('/notifications/:notificationId/read', checkOwnership(Notification, { ownerField: 'userId' }), markAsRead);


export default router;