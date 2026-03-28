import { Op, fn, col } from "sequelize";
import { Expo } from "expo-server-sdk";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { getIO } from "../config/socket.js";

const expo = new Expo({ useFcmV1: true });

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function emitToUser(userId, event, payload) {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit(event, payload);
    return true;
  } catch (error) {
    console.error("[NotificationService] Socket emit failed", {
      userId,
      event,
      error: error.message,
    });
    return false;
  }
}

function buildWhereClause(userId, filters = {}) {
  const where = { userId };

  if (filters.group) where.group = filters.group;
  if (filters.priority) where.priority = filters.priority;
  if (filters.type) where.type = filters.type;

  if (filters.unread === true || filters.unread === "true") {
    where.readAt = null;
  }

  if (filters.archived === true || filters.archived === "true") {
    where.isArchived = true;
  } else {
    where.isArchived = false;
  }

  if (filters.since) {
    where.createdAt = { [Op.gte]: new Date(filters.since) };
  }

  where[Op.or] = [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }];

  return where;
}

const NotificationService = {
  async createNotification(data) {
    const notification = await Notification.create({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      group: data.group,
      priority: data.priority,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
      actionUrl: data.actionUrl ?? null,
      metadata: data.metadata ?? {},
      expiresAt: data.expiresAt ?? null,
      read: data.read ?? false,
      readAt: data.readAt ?? null,
      isArchived: data.isArchived ?? false,
    });

    emitToUser(data.userId, "notification:new", notification.toJSON());
    const unreadCount = await NotificationService.getUnreadCount(data.userId);
    emitToUser(data.userId, "notification:count", { count: unreadCount });

    if (data.sendPush !== false && User?.rawAttributes?.expoPushToken) {
      const user = await User.findByPk(data.userId, {
        attributes: ["id", "expoPushToken"],
      });
      if (user?.expoPushToken) {
        await NotificationService.sendExpoPush(user.expoPushToken, notification);
      }
    }

    return notification;
  },

  async createBulkNotifications(recipients, baseData) {
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return [];
    }

    const rows = recipients.map((userId) => ({
      userId,
      type: baseData.type,
      title: baseData.title,
      message: baseData.message,
      group: baseData.group,
      priority: baseData.priority,
      entityType: baseData.entityType ?? null,
      entityId: baseData.entityId ?? null,
      actionUrl: baseData.actionUrl ?? null,
      metadata: baseData.metadata ?? {},
      expiresAt: baseData.expiresAt ?? null,
      read: baseData.read ?? false,
      readAt: baseData.readAt ?? null,
      isArchived: false,
    }));

    const notifications = await Notification.bulkCreate(rows, {
      returning: true,
      individualHooks: true,
    });

    const uniqueUserIds = [...new Set(notifications.map((notification) => notification.userId))];
    const unreadByUser = await NotificationService.getUnreadCountsByUserIds(uniqueUserIds);

    for (const notification of notifications) {
      emitToUser(notification.userId, "notification:new", notification.toJSON());
    }

    for (const userId of uniqueUserIds) {
      emitToUser(userId, "notification:count", {
        count: unreadByUser[userId] ?? 0,
      });
    }

    if (baseData.sendPush !== false && User?.rawAttributes?.expoPushToken) {
      const users = await User.findAll({
        where: {
          id: recipients,
          expoPushToken: { [Op.ne]: null },
        },
        attributes: ["id", "expoPushToken"],
      });

      const notificationByUserId = Object.fromEntries(
        notifications.map((notification) => [notification.userId, notification])
      );

      const messages = users
        .filter((user) => user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken))
        .map((user) =>
          NotificationService._buildPushMessage(
            user.expoPushToken,
            notificationByUserId[user.id]
          )
        );

      if (messages.length > 0) {
        await NotificationService._sendPushMessages(messages);
      }
    }

    return notifications;
  },

  async getNotifications(userId, options = {}) {
    const limit = Math.min(parseInt(options.limit ?? DEFAULT_PAGE_SIZE, 10), MAX_PAGE_SIZE);
    const page = parseInt(options.page ?? 1, 10);
    const offset =
      options.offset !== undefined
        ? parseInt(options.offset, 10)
        : Math.max(0, (page - 1) * limit);

    const where = buildWhereClause(userId, options);

    const { count, rows } = await Notification.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return {
      notifications: rows,
      total: count,
      limit,
      offset,
      hasMore: offset + rows.length < count,
    };
  },

  async getGroupedNotifications(userId, options = {}) {
    const where = buildWhereClause(userId, options);

    const notifications = await Notification.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: 200,
    });

    return notifications.reduce((acc, notification) => {
      const key = notification.group;
      if (!acc[key]) acc[key] = [];
      acc[key].push(notification);
      return acc;
    }, {});
  },

  async getById(notificationId, userId) {
    return Notification.findOne({
      where: { id: notificationId, userId },
    });
  },

  async getUnreadCount(userId) {
    return Notification.count({
      where: {
        userId,
        readAt: null,
        isArchived: false,
        [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }],
      },
    });
  },

  async getUnreadCountsByUserIds(userIds = []) {
    const uniqueUserIds = [...new Set((userIds || []).filter(Boolean))];
    if (uniqueUserIds.length === 0) return {};

    const rows = await Notification.findAll({
      attributes: ["userId", [fn("COUNT", col("id")), "count"]],
      where: {
        userId: uniqueUserIds,
        readAt: null,
        isArchived: false,
        [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }],
      },
      group: ["userId"],
      raw: true,
    });

    const unreadByUser = Object.fromEntries(uniqueUserIds.map((id) => [id, 0]));
    for (const row of rows) {
      unreadByUser[row.userId] = Number(row.count) || 0;
    }

    return unreadByUser;
  },

  async markAsRead(notificationId, userId) {
    const [updated] = await Notification.update(
      { readAt: new Date() },
      {
        where: {
          id: notificationId,
          userId,
          readAt: null,
        },
      }
    );

    if (updated) {
      const count = await NotificationService.getUnreadCount(userId);
      emitToUser(userId, "notification:count", { count });
    }

    return updated > 0;
  },

  async markAllAsRead(userId, group = null) {
    const where = { userId, readAt: null };
    if (group) {
      where.group = group;
    }

    const [updated] = await Notification.update(
      { readAt: new Date() },
      { where }
    );

    const count = await NotificationService.getUnreadCount(userId);
    emitToUser(userId, "notification:count", { count });

    return updated;
  },

  async archiveNotification(notificationId, userId) {
    const [updated] = await Notification.update(
      { isArchived: true },
      {
        where: {
          id: notificationId,
          userId,
        },
      }
    );

    return updated > 0;
  },

  async deleteNotification(notificationId, userId) {
    const deleted = await Notification.destroy({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (deleted) {
      const count = await NotificationService.getUnreadCount(userId);
      emitToUser(userId, "notification:count", { count });
    }

    return deleted > 0;
  },

  async pruneOldNotifications(days = 90) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return Notification.destroy({
      where: {
        readAt: { [Op.ne]: null },
        createdAt: { [Op.lt]: cutoff },
      },
    });
  },

  async sendExpoPush(pushToken, notification) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.warn("[Push] Invalid token:", pushToken);
      return;
    }

    const message = NotificationService._buildPushMessage(pushToken, notification);
    await NotificationService._sendPushMessages([message]);

    await notification.update({
      pushSent: true,
      pushToken,
      pushSentAt: new Date(),
    });
  },

  _buildPushMessage(pushToken, notification) {
    const priorityMap = {
      low: "default",
      medium: "default",
      high: "high",
      critical: "high",
    };

    return {
      to: pushToken,
      sound: notification.priority === "critical" ? "default" : undefined,
      title: notification.title,
      body: notification.message,
      priority: priorityMap[notification.priority] ?? "default",
      data: {
        notificationId: notification.id,
        type: notification.type,
        group: notification.group,
        entityType: notification.entityType,
        entityId: notification.entityId,
        metadata: notification.metadata,
      },
      channelId: notification.group,
      badge: 1,
    };
  },

  async _sendPushMessages(messages) {
    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        tickets.forEach((ticket, index) => {
          if (ticket.status === "error") {
            console.error("[Push] Ticket error:", ticket.message, chunk[index]?.to);
          }
        });
      } catch (error) {
        console.error("[Push] Chunk send error:", error.message);
      }
    }
  },
};

export default NotificationService;
