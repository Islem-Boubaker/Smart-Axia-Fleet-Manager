import { Op } from 'sequelize';
import Vehicle from '../models/vehicle.model.js';
import User from '../models/user.model.js';
import Reclamation from '../models/reclamation.model.js';
import { getPagination, getPagingData } from '../utils/pagination.js';
import { eventBus, FLEET_EVENTS } from '../events/eventBus.js';
import { buildCarPrompt } from '../utils/promptBuilder.js';
import validateAndFill from '../utils/validateAndFill.js';
import { runAgents } from '../utils/runAgents.js';
import { semanticSearch, semanticSet } from './semanticCache.service.js';

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

const buildSemanticCachePrompt = (vehicle) => {
    const payload = {
        id: vehicle?.id ?? null,
        brand: vehicle?.brand ?? null,
        model: vehicle?.model ?? null,
        year: vehicle?.year ?? null,
        mileage: vehicle?.mileage ?? null,
        vehicle_type: vehicle?.vehicle_type ?? null,
        transmission_type: vehicle?.transmission_type ?? null,
        fuel_type: vehicle?.fuel_type ?? null,
        engine_size: vehicle?.engine_size ?? null,
        avg_daily_km: vehicle?.avg_daily_km ?? null,
        driving_profile: vehicle?.driving_profile ?? null,
        climate_zone: vehicle?.climate_zone ?? null,
        accident_count: vehicle?.accident_count ?? null,
        reported_issues_text: vehicle?.reported_issues_text ?? null,
        last_oil_change_mileage: vehicle?.last_oil_change_mileage ?? null,
        last_tire_change_mileage: vehicle?.last_tire_change_mileage ?? null,
        last_brake_change_mileage: vehicle?.last_brake_change_mileage ?? null,
    };

    const prompt = JSON.stringify(payload);
    return prompt.length <= 1024 ? prompt : prompt.slice(0, 1024);
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

export const getAllVehicles = async (query = {}, cacheKey = null) => {
    const { page, limit, offset } = getPagination(query);

    const { count, rows } = await Vehicle.findAndCountAll({
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });

    return getPagingData(count, rows, page, limit);
};

export const getVehicleById = async (id, cacheKey = null) => {
    return await Vehicle.findByPk(id);
};

// ─────────────────────────────────────────────
// Update — with full notification triggers
// ─────────────────────────────────────────────

export const updateVehicle = async (id, data) => {
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) return null;

    const previousStatus = vehicle.status;
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
                vehicle: updatedVehicle,
                tripId: data.tripId ?? null,
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
                vehicle: updatedVehicle,
                tripId: data.tripId ?? null,
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
                    vehicle: updatedVehicle,
                    driverId: updatedVehicle.driverId ?? previousDriverId ?? null,
                    managerId,
                    location: data.location ?? null,
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
            status: 'AVAILABLE',
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


export const generateMaintenanceAI = async (vehicleId) => {
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) return null;

    const prompt = buildCarPrompt(vehicle);
    const semanticPrompt = buildSemanticCachePrompt(vehicle);

    const semanticAttributes = {
        feature: 'maintenance-recommendation',
        vehicleId: String(vehicleId),
    };

    const parseRecommendation = (rawText) => {
        const raw = typeof rawText === 'string' ? rawText : '';
        const clean = raw.replace(/```json|```/gi, '').trim();
        const start = clean.indexOf('{');
        const end = clean.lastIndexOf('}');

        if (start === -1 || end === -1 || end < start) {
            throw new Error('No valid JSON object found in AI output');
        }

        const jsonCandidate = clean.slice(start, end + 1);
        let parsed = JSON.parse(jsonCandidate);
        parsed = validateAndFill(parsed);
        return parsed;
    };

    const cached = await semanticSearch(semanticPrompt, { attributes: semanticAttributes });

    if (cached?.response) {
        try {
            const parsed = parseRecommendation(cached.response);
            await vehicle.update({
                maintenance_recommandation_ai: parsed,
            });
            return parsed;
        } catch (error) {
            console.warn('[SemanticCache] Cached recommendation parse failed:', error.message);
        }
    }

    const data = await runAgents(prompt);
    const raw = typeof data?.response === 'string' ? data.response : '';

    try {
        const parsed = parseRecommendation(raw);

        await vehicle.update({
            maintenance_recommandation_ai: parsed,
        });

        await semanticSet(semanticPrompt, JSON.stringify(parsed), {
            attributes: semanticAttributes,
        });

        return parsed;
    } catch (err) {
        return { raw, parseError: true, error: err?.message || 'Invalid AI output' };
    }
};