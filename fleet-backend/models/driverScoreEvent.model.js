import { DataTypes } from "sequelize";
import { sequelize } from "../config/connectdb.js";

const DriverScoreEvent = sequelize.define(
  "DriverScoreEvent",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    driverId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    tripId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "trips",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    reclamationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "reclamations",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    eventType: {
      type: DataTypes.ENUM(
        "ACCIDENT_RECLAMATION",
        "ROUTE_DEVIATION",
        "TRIP_COMPLETION"
      ),
      allowNull: false,
    },
    sourceKey: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    pointsDelta: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    occurredAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "driver_score_events",
    timestamps: true,
  }
);

export default DriverScoreEvent;
