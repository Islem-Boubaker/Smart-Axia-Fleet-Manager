import * as notificationService from '../services/notification.service.js';
import { successResponse } from '../utils/response.js';

export const createNotification = async (req, res, next) => {
  try {
    const notification = await notificationService.createNotificationService(req.body);
    successResponse(res, notification, 'Notification created', 201);
  } catch (err) {
    next(err);
  }
};

export const getAllNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getAllNotificationsService(req.query, req.user);
    successResponse(res, result, 'Notifications retrieved');
  } catch (err) {
    next(err);
  }
};

export const getNotificationById = async (req, res, next) => {
  try {
    const notification = await notificationService.getNotificationByIdService(
      req.params.notificationId,
      req.user
    );
    successResponse(res, notification, 'Notification fetched');
  } catch (err) {
    next(err);
  }
};

export const updateNotification = async (req, res, next) => {
  try {
    const notification = await notificationService.updateNotificationService(
      req.params.notificationId,
      req.body,
      req.user
    );
    successResponse(res, notification, 'Notification updated');
  } catch (err) {
    next(err);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    await notificationService.deleteNotificationService(req.params.notificationId, req.user);
    successResponse(res, null, 'Notification deleted');
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markNotificationAsReadService(
      req.params.notificationId,
      req.user
    );
    successResponse(res, notification, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllNotificationsAsReadService(req.user);
    successResponse(res, result, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCountService(req.user);
    successResponse(res, { count }, 'Unread count fetched');
  } catch (err) {
    next(err);
  }
};

export const clearReadNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.clearReadNotificationsService(req.user);
    successResponse(res, result, 'Read notifications cleared');
  } catch (err) {
    next(err);
  }
};