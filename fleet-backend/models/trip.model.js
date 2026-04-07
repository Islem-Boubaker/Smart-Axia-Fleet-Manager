import { DataTypes } from "sequelize";
import { sequelize } from "../config/connectdb.js";

const Trip = sequelize.define(
  "Trip",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // 🔗 Foreign Key → User (Driver)
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    // 🔗 Foreign Key → Vehicle
    vehicleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "vehicles",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    // 🌍 Region
    region: {
      type: DataTypes.STRING,
      allowNull: true, // changed to allow null to avoid migration error with existing records
    },

    startLocation: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    endLocation: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    distance: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    fuel: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    cost: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "scheduled",
        "ongoing",
        "completed",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "scheduled",
    },
  },
  {
    tableName: "trips",
    timestamps: true,
  }
);

export default Trip;