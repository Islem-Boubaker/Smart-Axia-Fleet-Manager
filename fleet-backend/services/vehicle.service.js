import { Op } from 'sequelize';
import Vehicle from '../models/vehicle.model.js';
import User from '../models/user.model.js';
import Reclamation from '../models/reclamation.model.js';
import { getPagination, getPagingData } from '../utils/pagination.js';
import { eventBus, FLEET_EVENTS } from '../events/eventBus.js';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const publishSafely = (event, payload, label) => {
    try {
        eventBus.emitEvent(event, payload);
    } catch (err) {
        console.error(`[EventBus] ${label} publish failed:`, err);
    }
};

/**
 * Resolves the manager ID for a vehicle.
 * Priority: vehicle.managerId → first MANAGER/ADMIN user in DB → null
 */
const resolveManagerId = async (vehicle) => {
    if (vehicle?.managerId) return vehicle.managerId;

    const manager = await User.findOne({
        where: { role: { [Op.in]: ['MANAGER', 'ADMIN'] } },
        order: [['createdAt', 'ASC']],
        attributes: ['id'],
    });

    return manager?.id ?? null;
};

// ─────────────────────────────────────────────
// Create
// ─────────────────────────────────────────────

export const createVehicle = async (data) => {
    return await Vehicle.create(data);
};

// ─────────────────────────────────────────────
// Read
// ─────────────────────────────────────────────

export const getAllVehicles = async (query = {}) => {
    const { page, limit, offset } = getPagination(query);

    const { count, rows } = await Vehicle.findAndCountAll({
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });

    return getPagingData(count, rows, page, limit);
};

export const getVehicleById = async (id) => {
    return await Vehicle.findByPk(id);
};

// ─────────────────────────────────────────────
// Update — with full notification triggers
// ─────────────────────────────────────────────

export const updateVehicle = async (id, data) => {
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) return null;

    const previousStatus   = vehicle.status;
    const previousDriverId = vehicle.driverId ?? null;

    const updatedVehicle = await vehicle.update(data);

    // Resolve manager once, reuse across all events below
    const managerId = await resolveManagerId(updatedVehicle);

    // ── Driver assigned ──────────────────────────────────────────────────
    if (data?.driverId && data.driverId !== previousDriverId) {
        publishSafely(
            FLEET_EVENTS.DRIVER_ASSIGNED,
            {
                driverId: data.driverId,
                vehicle:  updatedVehicle,
                tripId:   data.tripId ?? null,
            },
            'DRIVER_ASSIGNED'
        );
    }

    // ── Driver unassigned ────────────────────────────────────────────────
    if (data?.driverId === null && previousDriverId) {
        publishSafely(
            FLEET_EVENTS.DRIVER_UNASSIGNED,
            {
                driverId: previousDriverId,
                vehicle:  updatedVehicle,
                tripId:   data.tripId ?? null,
            },
            'DRIVER_UNASSIGNED'
        );
    }

    // ── Status-change events ─────────────────────────────────────────────
    if (data?.status && data.status !== previousStatus) {
        const normalizedStatus = String(data.status).toUpperCase();

        if (normalizedStatus === 'OUT_OF_SERVICE') {
            publishSafely(
                FLEET_EVENTS.VEHICLE_BREAKDOWN,
                {
                    vehicle:   updatedVehicle,
                    driverId:  updatedVehicle.driverId ?? previousDriverId ?? null,
                    managerId,
                    location:  data.location ?? null,
                },
                'VEHICLE_BREAKDOWN'
            );
        }
    }

    return updatedVehicle;
};

// ─────────────────────────────────────────────
// Delete
// ─────────────────────────────────────────────

export const deleteVehicle = async (id) => {
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) return null;

    await Reclamation.destroy({ where: { vehicleId: id } });
    await vehicle.destroy();

    return true;
};

// ─────────────────────────────────────────────
// Idle detection — called by a cron job, NOT by updateVehicle
// ─────────────────────────────────────────────

/**
 * Checks for vehicles that have been AVAILABLE (idle) for longer than
 * `thresholdMinutes` and fires VEHICLE_IDLE for each one.
 *
 * Usage example (in your cron/scheduler file):
 *
 *   import cron from 'node-cron';
 *   import { checkIdleVehicles } from './services/vehicle.service.js';
 *
 *   cron.schedule('* /15 * * * *', () => checkIdleVehicles(30));
 */
export const checkIdleVehicles = async (thresholdMinutes = 30) => {
    const cutoff = new Date(Date.now() - thresholdMinutes * 60 * 1000);

    const idleVehicles = await Vehicle.findAll({
        where: {
            status:    'AVAILABLE',
            updatedAt: { [Op.lte]: cutoff },
        },
    });

    for (const vehicle of idleVehicles) {
        const managerId = await resolveManagerId(vehicle);

        const durationMinutes = Math.floor(
            (Date.now() - new Date(vehicle.updatedAt).getTime()) / 60000
        );

        publishSafely(
            FLEET_EVENTS.VEHICLE_IDLE,
            {
                vehicle,
                managerId,
                durationMinutes,
            },
            'VEHICLE_IDLE'
        );
    }
};