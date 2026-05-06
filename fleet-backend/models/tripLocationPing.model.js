import { DataTypes } from "sequelize";
import { sequelize } from "../config/connectdb.js";

const TripLocationPing = sequelize.define(
  "TripLocationPing",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tripId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "trips",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    accuracy: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    speed: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    heading: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    recordedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "trip_location_pings",
    timestamps: true,
    indexes: [
      { fields: ["tripId"] },
      { fields: ["userId"] },
      { fields: ["tripId", "recordedAt"] },
    ],
  }
);

export default TripLocationPing;
