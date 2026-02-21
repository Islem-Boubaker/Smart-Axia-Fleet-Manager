import { DataTypes } from "sequelize";
import { sequelize } from "../config/connectdb.js";

const Reclamation = sequelize.define(
  "Reclamation",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
      allowNull: false,
    },
  },
  {
    tableName: "reclamations",
    timestamps: true,
    createdAt: "createdAt",
 
  }
);

export default Reclamation;
  