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

    plaque_immatriculation: {
      type: DataTypes.STRING(20),
      unique: true,
    },

    type: {
      type: DataTypes.ENUM('voiture', 'camion', 'moto', 'camionnette'),
      defaultValue: 'voiture',
    },

    Active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    insurance_expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    tech_visit_expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },


    Vehicle_Model: {
      type: DataTypes.ENUM('Car', 'SUV', 'Van', 'Truck', 'Bus', 'Motorcycle'),
      allowNull: false,
      defaultValue: 'Car',
    },

    Mileage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    Vehicle_Age: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    Maintenance_History: {
      type: DataTypes.ENUM('Good', 'Average', 'Poor'),
      allowNull: false,
      defaultValue: 'Average',
    },

    Reported_Issues: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    Service_History: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    Accident_History: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    Fuel_Efficiency: {
      type: DataTypes.FLOAT, // km/l
      allowNull: true,
    },

    consumption: {
      type: DataTypes.FLOAT, // liters / 100km
      allowNull: true,
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

    Days_Since_Last_Service: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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

    photos: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    tableName: 'vehicles',
    timestamps: true,
    indexes: [{ fields: ['plaque_immatriculation'] }],
  }
);

export default Vehicle;
