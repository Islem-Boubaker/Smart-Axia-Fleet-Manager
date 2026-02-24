import { DataTypes } from sequelize;
import sequelize from '../config/connectdb.js';


const Notification = sequelize.define(
    'Notification',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        type: {
            type: DataTypes.ENUM(
                'maintenance',
                'driver',
                'vehicle',
                'warning',
                'success'
            ),
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        read: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    {
        tableName: 'notifications',
        timestamps: true,
    }
);

export default Notification;