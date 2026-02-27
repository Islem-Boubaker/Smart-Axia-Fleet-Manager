import express from 'express';
import {
  createNotification,
  getAllNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  markAsRead
} from '../controllers/notification.controller.js';

const router = express.Router();



router.post('/notifications/', createNotification);



router.get('/notifications/', getAllNotifications);



router.get('/notifications/:id', getNotificationById);



router.put('/notifications/:id', updateNotification);



router.delete('/notifications/:id', deleteNotification);


router.patch('/notifications/:id/read', markAsRead);


export default router;