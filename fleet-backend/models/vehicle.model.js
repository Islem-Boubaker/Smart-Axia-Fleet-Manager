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
      allowNull: true,
    },

    capacity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Vehicle capacity in kg'
    },
    conditionRating: {
      type: DataTypes.INTEGER,
      defaultValue: 7,
      allowNull: false,
      validate: {
        min: 1,
        max: 10
      },
      comment: 'Vehicle condition rating from 1-10 (1=poor, 10=excellent)'
    },
    fuelEfficiencyCategory: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
      allowNull: false,
      comment: 'Categorized fuel efficiency for ML model'
    },
    // --- Identity ---

    vehicle_type: {
      type: DataTypes.ENUM('Car', 'SUV', 'Van', 'Truck', 'Bus', 'Motorcycle'),
      allowNull: false,
  defaultValue: 'Car',
},

  is_active: {
  type: DataTypes.BOOLEAN,
  defaultValue: true,
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

  // --- Compliance ---
  insurance_expiry_date: {
  type: DataTypes.DATEONLY,
  allowNull: true,
},
  tech_visit_expiry_date: {
  type: DataTypes.DATEONLY,
  allowNull: true,
},


  // --- Specs ---
  year: {                           // NEW — replaces Vehicle_Age
  type: DataTypes.INTEGER,
  allowNull: true,
},
  fuel_type: {                      // NEW
  type: DataTypes.ENUM('gasoline', 'diesel', 'electric', 'hybrid', 'lpg'),
  allowNull: true,
},
  engine_size: {
  type: DataTypes.INTEGER,        // cc
  allowNull: true,
},
  fuel_efficiency: {
  type: DataTypes.FLOAT,          // km/l
  allowNull: true,
},
  // --- Mileage & Maintenance ---
  mileage: {
  type: DataTypes.INTEGER,
  allowNull: false,
  defaultValue: 0,
},


  // --- Condition ---
  tire_age: {
  type: DataTypes.INTEGER,
  allowNull: true,
},

  brake_age: {
  type: DataTypes.INTEGER,
  allowNull: true,
},
  battery_status: {
  type: DataTypes.INTEGER,
  allowNull: true,
},
  // --- Identity (add these two) ---
  brand: {
  type: DataTypes.STRING(50),
  allowNull: true,                  // Toyota, Ford, Renault...
},
  model: {
  type: DataTypes.STRING(50),
  allowNull: true,                  // Corolla, Transit...
},
  transmission_type: {
  type: DataTypes.ENUM('manual', 'automatic', 'cvt', 'dct'),
  allowNull: true,
},

  // --- Usage patterns ---
  avg_daily_km: {
  type: DataTypes.FLOAT,
  allowNull: true,
},
  driving_profile: {
  type: DataTypes.ENUM('city', 'highway', 'mixed', 'off_road'),
  allowNull: true,
  defaultValue: 'mixed',
},
  climate_zone: {
  type: DataTypes.ENUM('hot_dry', 'cold', 'humid', 'temperate'),
  allowNull: true,
  defaultValue: 'hot_dry',          // Tunisia default
},

  // --- Service history milestones ---
  last_service_date: {
  type: DataTypes.DATEONLY,
  allowNull: true,
},
  last_oil_change_mileage: {
  type: DataTypes.INTEGER,
  allowNull: true,
},
  last_tire_change_mileage: {
  type: DataTypes.INTEGER,
  allowNull: true,
},
  last_brake_change_mileage: {
  type: DataTypes.INTEGER,
  allowNull: true,
},
  last_battery_change_date: {
  type: DataTypes.DATEONLY,
  allowNull: true,
},
  ac_last_service_date: {
  type: DataTypes.DATEONLY,
  allowNull: true,
},
  coolant_last_change_date: {
  type: DataTypes.DATEONLY,
  allowNull: true,
},

  // --- Incident history ---
  accident_count: {
  type: DataTypes.INTEGER,
  defaultValue: 0,
},
  reported_issues_text: {
  type: DataTypes.ARRAY(DataTypes.TEXT),
  defaultValue: [],                 // ["engine noise", "AC weak", ...]
},
  maintenance_recommandation_ai: {
  type: DataTypes.JSON,
  allowNull: true,
}
  },
{
  tableName: 'vehicles',
    timestamps: true,
      indexes: [{ fields: ['plaque_immatriculation'] }],
  }
);

export default Vehicle;