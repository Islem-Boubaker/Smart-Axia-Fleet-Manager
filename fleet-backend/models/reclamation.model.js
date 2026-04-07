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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    vehicleId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING), // Array of image URLs
      allowNull: false,
      defaultValue: [],
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
