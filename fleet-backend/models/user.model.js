import { DataTypes } from 'sequelize';
import { sequelize } from '../config/connectdb.js';
import bcrypt from 'bcrypt'; // ✅ use native bcrypt (faster)

// 🔧 configurable salt rounds (easy to change later)
const SALT_ROUNDS = 10;

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true },
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    role: {
      type: DataTypes.ENUM('ADMIN', 'DRIVER', 'MANAGER'),
      allowNull: false,
      defaultValue: 'DRIVER',
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    datepermi: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    licenseNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    licenseExpiry: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM('active', 'inactive', 'on-leave'),
      allowNull: true,
      defaultValue: 'active',
    },

    assignedVehicle: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    rating: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: { min: 0, max: 5 },
    },

    company: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    postalCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    taxId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // 🔔 Notifications
    emailTrips: { type: DataTypes.BOOLEAN, defaultValue: true },
    emailMaintenance: { type: DataTypes.BOOLEAN, defaultValue: true },
    emailDrivers: { type: DataTypes.BOOLEAN, defaultValue: false },
    emailAI: { type: DataTypes.BOOLEAN, defaultValue: true },
    emailSystem: { type: DataTypes.BOOLEAN, defaultValue: true },

    pushTrips: { type: DataTypes.BOOLEAN, defaultValue: true },
    pushMaintenance: { type: DataTypes.BOOLEAN, defaultValue: true },
    pushDrivers: { type: DataTypes.BOOLEAN, defaultValue: true },
    pushAI: { type: DataTypes.BOOLEAN, defaultValue: true },
    pushSystem: { type: DataTypes.BOOLEAN, defaultValue: true },
    pushAlerts: { type: DataTypes.BOOLEAN, defaultValue: true },

    smsAlerts: { type: DataTypes.BOOLEAN, defaultValue: false },

    expoPushToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    completedTrips: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Number of successfully completed trips'
    }, totalTrips: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Total number of assigned trips (completed + cancelled + ongoing)'
    },
    yearsOfExperience: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Years of driving experience'
    },
    familiarRegions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false,
      comment: 'Regions the driver is familiar with (e.g., ["Tunis", "Sfax"])'
    },
    experienceYears: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: "Recommendation compatibility alias for yearsOfExperience",
    },
    driverRating: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 3.5,
      validate: { min: 0, max: 5 },
    },
    failedTrips: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    successRate: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.75,
      validate: { min: 0, max: 1 },
    },
    licenseType: {
      type: DataTypes.ENUM("B", "C", "D", "CE"),
      allowNull: false,
      defaultValue: "B",
    },
    licenseExpiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    medicalCheckExpiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    preferredRegion: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },


  {
    tableName: 'users',
    timestamps: true,

    // ✅ PERFORMANCE: add DB index
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
    ],

    hooks: {
      // 🔐 hash password before create
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
        }
      },

      // 🔐 hash password only if changed
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
        }
      },
    },

    // 🔥 NEVER return password in JSON responses
    defaultScope: {
      attributes: { exclude: ['password'] },
    },

    // 🔥 used explicitly when password is needed (login)
    scopes: {
      withPassword: {
        attributes: { include: ['password'] },
      },
    },
  }
);


// ✅ Optimized password comparison
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};


// ✅ helper for safe response (optional but clean)
User.prototype.toSafeJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};


export default User;
