import { DataTypes } from 'sequelize';
import { sequelize } from '../config/connectdb.js';

const Vehicle = sequelize.define(
  'vehicle',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    vin: {
      type: DataTypes.STRING(17),
      unique: true,
      allowNull: true,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true },
    },
    photos: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    plaque_immatriculation: {
      type: DataTypes.STRING(20),
      unique: true,
    },

    type: {
      type: DataTypes.ENUM('car', 'truck', 'motorcycle', 'van'),
      defaultValue: 'car',
    },

    Active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },


    Vehicle_Model: {
      type: DataTypes.ENUM('Car', 'SUV', 'Van', 'Truck', 'Bus', 'Motorcycle'),
      allowNull: false,
    },

    max_load: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    insurance_expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    tech_visit_expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    Mileage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    Vehicle_Age: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    Engine_Size: {
      type: DataTypes.INTEGER, // cc
      allowNull: true,
    },

    Tire_Condition: {
      type: DataTypes.ENUM('New', 'Good', 'Worn Out'),
      allowNull: false,
      defaultValue: 'Good',
    },

    Brake_Condition: {
      type: DataTypes.ENUM('New', 'Good', 'Worn Out'),
      allowNull: false,
      defaultValue: 'Good',
    },

    Battery_Status: {
      type: DataTypes.ENUM('New', 'Good', 'Weak'),
      allowNull: false,
      defaultValue: 'Good',
    },

    Need_Maintenance: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('AVAILABLE', 'IN_MAINTENANCE', 'OUT_OF_SERVICE', 'ON_TRIP'),
      allowNull: false,
      defaultValue: 'AVAILABLE',
    },
  },
  {
    tableName: 'vehicles',
    timestamps: true,
    indexes: [{ fields: ['plaque_immatriculation'] }],
  }
);

export default Vehicle;
