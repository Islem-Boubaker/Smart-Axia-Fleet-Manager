import { DataTypes } from "sequelize";
import { sequelize } from "../config/connectdb.js";

const TripStop = sequelize.define(
  "TripStop",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    tripId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "trips", key: "id" },
      onDelete: "CASCADE",
    },

    stopOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    locationName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("pending", "reached", "skipped"),
      allowNull: false,
      defaultValue: "pending",
    },

    arrivalTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    estimatedArrival: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    isDestination: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "trip_stops",
    timestamps: true,
  }
);

export default TripStop;