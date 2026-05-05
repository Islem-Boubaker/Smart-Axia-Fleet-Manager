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
      allowNull: true,
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

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    startLocation: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    startLatitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    startLongitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    endLocation: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    endLatitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    endLongitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    plannedEndTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    distance: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    fuel: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    revenue: {
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
    requiredCapacity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Required load capacity in kg for this trip'
    },
    loadType: {
      type: DataTypes.ENUM("general", "cold", "fragile", "heavy"),
      allowNull: false,
      defaultValue: "general",
    },
    scoreRouteDeviationApplied: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    }
  },
  {
    tableName: "trips",
    timestamps: true,
  }
);

export default Trip;
