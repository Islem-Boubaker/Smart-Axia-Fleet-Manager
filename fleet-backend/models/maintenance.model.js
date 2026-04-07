import { DataTypes } from 'sequelize';
import { sequelize } from '../config/connectdb.js';


const Maintenance = sequelize.define(
  'Maintenance',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    vehiclePlate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    technician: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cost: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    mileage: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'scheduled',
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'maintenances',
    timestamps: true,
  }
);

export default Maintenance;