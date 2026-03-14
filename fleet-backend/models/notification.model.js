import { DataTypes } from "sequelize";
import { sequelize } from "../config/connectdb.js";

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // 🔔 who receives it
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },

    // ✅ category/type
    type: {
      type: DataTypes.ENUM("maintenance", "driver", "vehicle", "trip", "warning", "success"),
      allowNull: false,
    },

    // 🎯 priority
    priority: {
      type: DataTypes.ENUM("low", "medium", "high"),
      allowNull: false,
      defaultValue: "medium",
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },


    entityType: {
      type: DataTypes.STRING, // "maintenance" | "vehicle" | "trip" | "reclamation" ...
      allowNull: true,
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    // optional: redirect url in front
    actionUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // extra details (json)
    metadata: {
      type: DataTypes.JSONB, // works great in Postgres/Supabase
      allowNull: true,
    },

    // ✅ read management
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
  }
);

export default Notification;