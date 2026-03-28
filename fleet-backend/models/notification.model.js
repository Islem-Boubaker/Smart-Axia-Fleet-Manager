import { DataTypes } from "sequelize";
import { sequelize } from "../config/connectdb.js";
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_GROUPS,
  PRIORITY_LEVELS,
  TYPE_TO_GROUP,
  TYPE_TO_PRIORITY,
} from "../constants/notification.constants.js";

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    type: {
      type: DataTypes.ENUM(...Object.values(NOTIFICATION_TYPES)),
      allowNull: false,
    },
    group: {
      type: DataTypes.ENUM(...Object.values(NOTIFICATION_GROUPS)),
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM(...Object.values(PRIORITY_LEVELS)),
      allowNull: false,
      defaultValue: PRIORITY_LEVELS.MEDIUM,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    entityType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    actionUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isArchived: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    pushSent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    pushSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pushToken: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
    indexes: [
      { fields: ["userId"] },
      { fields: ["type"] },
      { fields: ["group"] },
      { fields: ["priority"] },
      { fields: ["read"] },
      { fields: ["isArchived"] },
      { fields: ["createdAt"] },
      { fields: ["userId", "read"] },
      { fields: ["userId", "group"] },
    ],
    hooks: {
      beforeValidate(notification) {
        if (notification.type) {
          if (notification.group == null) {
            notification.group = TYPE_TO_GROUP[notification.type];
          }
          if (notification.priority == null) {
            notification.priority = TYPE_TO_PRIORITY[notification.type];
          }
        }
      },
      beforeSave(notification) {
        if (notification.changed("read")) {
          notification.readAt = notification.read ? new Date() : null;
        }
        if (notification.changed("readAt")) {
          notification.read = Boolean(notification.readAt);
        }
      },
    },
  }
);

Notification.associate = (models) => {
  Notification.belongsTo(models.User, {
    foreignKey: "userId",
    as: "recipient",
  });
};

export default Notification;