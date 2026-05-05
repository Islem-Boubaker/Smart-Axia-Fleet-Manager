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
    vehicleId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'vehicles', key: 'id' },
      onDelete: 'RESTRICT',
    },
    reclamationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'reclamations', key: 'id' },
      onDelete: 'SET NULL',
    },
    vehiclePlate: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    technician: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cost: {
      type: DataTypes.FLOAT,
      allowNull: false,
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
      type: DataTypes.ENUM('scheduled', 'pending', 'in progress', 'completed', 'cancelled'),
      allowNull: true,
      defaultValue: 'pending',
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },
  },
  {
    tableName: 'maintenances',
    timestamps: true,
  }
);

export default Maintenance;
