import NotificationService from "../services/notification.service.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { getPagination } from "../utils/pagination.js";
import cacheMiddleware from "../middlewares/cache.middleware.js";

const sendSuccess = (res, data, statusCode = 200) => {
  return successResponse(res, data, "Success", statusCode);
};

const sendError = (res, error) => {
  const statusCode = error?.status ?? 500;
  const message = error?.message ?? "Error";
  return errorResponse(res, message, statusCode, error?.details);
};

const invalidateNotificationCache = async (id) => {
  await cacheMiddleware.invalidatePattern('notifications:*');
  if (id) {
    await cacheMiddleware.invalidatePattern(`notifications:show:id=${id}*`);
  }
};

const NotificationController = {
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { page, limit, offset } = getPagination(req.query);

      const options = {
        page,
        limit,
        offset,
        group: req.query.group,
        priority: req.query.priority,
        type: req.query.type,
        unread: req.query.unread,
        archived: req.query.archived,
        since: req.query.since,
      };

      const result = await NotificationService.getNotifications(userId, options, req.cacheKey);
      if (req.cacheSet) await req.cacheSet({ success: true, message: "Success", data: result });
      return sendSuccess(res, result);
    } catch (error) {
      return sendError(res, error);
    }
  },

  async getGroupedNotifications(req, res) {
    try {
      const grouped = await NotificationService.getGroupedNotifications(req.user.id, req.query, req.cacheKey);
      if (req.cacheSet) await req.cacheSet({ success: true, message: "Success", data: { groups: grouped } });
      return sendSuccess(res, { groups: grouped });
    } catch (error) {
      return sendError(res, error);
    }
  },

  async getUnreadCount(req, res) {
    try {
      const count = await NotificationService.getUnreadCount(req.user.id, req.cacheKey);
      if (req.cacheSet) await req.cacheSet({ success: true, message: "Success", data: { count } });
      return sendSuccess(res, { count });
    } catch (error) {
      return sendError(res, error);
    }
  },

  async getById(req, res) {
    try {
      const notification = await NotificationService.getById(req.params.id, req.user.id, req.cacheKey);
      if (!notification) {
        return sendError(res, { status: 404, message: "Notification not found" });
      }
      if (req.cacheSet) await req.cacheSet({ success: true, message: "Success", data: notification });
      return sendSuccess(res, notification);
    } catch (error) {
      return sendError(res, error);
    }
  },

  async markAsRead(req, res) {
    try {
      const updated = await NotificationService.markAsRead(req.params.id, req.user.id);
      if (!updated) {
        return sendError(res, {
          status: 404,
          message: "Notification not found or already read",
        });
      }
      await invalidateNotificationCache(req.params.id);
      return sendSuccess(res, { message: "Marked as read" });
    } catch (error) {
      return sendError(res, error);
    }
  },

  async markAllAsRead(req, res) {
    try {
      const updated = await NotificationService.markAllAsRead(req.user.id, req.body?.group ?? null);
      await invalidateNotificationCache();
      return sendSuccess(res, { message: `Marked ${updated} notifications as read` });
    } catch (error) {
      return sendError(res, error);
    }
  },

  async archiveNotification(req, res) {
    try {
      const archived = await NotificationService.archiveNotification(req.params.id, req.user.id);
      if (!archived) {
        return sendError(res, { status: 404, message: "Notification not found" });
      }
      await invalidateNotificationCache(req.params.id);
      return sendSuccess(res, { message: "Archived" });
    } catch (error) {
      return sendError(res, error);
    }
  },

  async deleteNotification(req, res) {
    try {
      const deleted = await NotificationService.deleteNotification(req.params.id, req.user.id);
      if (!deleted) {
        return sendError(res, { status: 404, message: "Notification not found" });
      }
      await invalidateNotificationCache(req.params.id);
      return sendSuccess(res, { message: "Deleted" });
    } catch (error) {
      return sendError(res, error);
    }
  },

  async sendTestNotification(req, res) {
    try {
      if (process.env.NODE_ENV === "production") {
        return sendError(res, { status: 403, message: "Not available in production" });
      }

      const notification = await NotificationService.createNotification({
        userId: req.body?.userId ?? req.user.id,
        type: req.body?.type,
        title: req.body?.title,
        message: req.body?.message,
        metadata: req.body?.metadata ?? {},
        sendPush: false,
      });

      await invalidateNotificationCache(notification?.id);

      return sendSuccess(res, notification, 201);
    } catch (error) {
      return sendError(res, error);
    }
  },
};

export default NotificationController;
