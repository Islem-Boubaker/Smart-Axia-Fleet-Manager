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
        //vin=Numéro d'Identification du Véhicule
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
            type: DataTypes.ENUM(
                'voiture',
                'camion',
                'moto',
                'camionnette'
            ),

            defaultValue: 'voiture',
        },
        odometer: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: 'vehicles',
        timestamps: true,
        indexes: [{ fields: ['plaque_immatriculation'] }]
    }
);

export default Vehicle;