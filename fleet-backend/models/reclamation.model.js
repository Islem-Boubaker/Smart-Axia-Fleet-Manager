import { DataTypes } from "sequelize";
import { sequelize } from "../config/connectdb.js";

const Reclamation = sequelize.define(
  "Reclamation",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "PENDING",
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "general",
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    vehicleId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    driverName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    vehicleName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    vehiclePlate: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING), // Array of image URLs
      allowNull: false,
      defaultValue: [],
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    tableName: "reclamations",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  }
);

export default Reclamation;
