import { Op } from 'sequelize';
import Vehicle from '../models/vehicle.model.js';
import User from '../models/user.model.js';
import Reclamation from '../models/reclamation.model.js';
import Trip from '../models/trip.model.js';
import { getPagination, getPagingData } from '../utils/pagination.js';
import { eventBus, FLEET_EVENTS } from '../events/eventBus.js';
import { buildCarPrompt } from '../utils/promptBuilder.js';
import validateAndFill from '../utils/validateAndFill.js';
import { semanticSearch, semanticSet } from './semanticCache.service.js';
import { callGeminiAndParse } from './geminiService.js';
import { computeMaintenanceFlags } from './maintenanceRules.service.js';

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

// Minimal cache key — only fields that change the recommendation outcome.
// Must stay under 128 tokens (semantic cache API limit).
const buildSemanticCachePrompt = (vehicle) => {
    const v = vehicle ?? {};
    return [
        `id:${v.id ?? ''}`,
        `km:${v.mileage ?? 0}`,
        `oil:${v.last_oil_change_mileage ?? 0}`,
        `tire:${v.last_tire_change_mileage ?? 0}`,
        `brake:${v.last_brake_change_mileage ?? 0}`,
        `tireAge:${v.tire_age ?? 0}`,
        `brakeAge:${v.brake_age ?? 0}`,
        `year:${v.year ?? 0}`,
    ].join(' ');
};

const VALID_VEHICLE_STATUSES = new Set([
    'AVAILABLE',
    'IN_MAINTENANCE',
    'OUT_OF_SERVICE',
    'ON_TRIP',
]);

const VEHICLE_TYPE_BY_UI_TYPE = {
    car: 'Car',
    suv: 'SUV',
    van: 'Van',
    truck: 'Truck',
    bus: 'Bus',
    motorcycle: 'Motorcycle',
};

const parseBoolean = (value, fallback = undefined) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'y', 'on', 'active', 'available'].includes(normalized)) return true;
        if (['false', '0', 'no', 'n', 'off', 'inactive', 'out_of_service'].includes(normalized)) return false;
    }
    return fallback;
};

const parseOptionalNumber = (value) => {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeVehicleStatus = (status) => {
    if (status === null || status === undefined) return undefined;
    const normalized = String(status).trim().toUpperCase().replace(/[-\s]+/g, '_');
    if (normalized === 'MAINTENANCE') return 'IN_MAINTENANCE';
    if (normalized === 'INACTIVE') return 'OUT_OF_SERVICE';
    if (normalized === 'IN_USE') return 'ON_TRIP';
    return VALID_VEHICLE_STATUSES.has(normalized) ? normalized : undefined;
};

const normalizeVehiclePayload = (data = {}) => {
    const normalized = { ...data };

    if (normalized.type && !normalized.vehicle_type) {
        const type = String(normalized.type).trim().toLowerCase();
        normalized.vehicle_type = VEHICLE_TYPE_BY_UI_TYPE[type] ?? normalized.type;
    }

    if (normalized.Vehicle_Model && !normalized.vehicle_type) {
        normalized.vehicle_type = normalized.Vehicle_Model;
    }

    if (normalized.Mileage !== undefined && normalized.mileage === undefined) {
        const mileage = parseOptionalNumber(normalized.Mileage);
        if (mileage !== undefined) normalized.mileage = mileage;
    }

    if (normalized.Engine_Size !== undefined && normalized.engine_size === undefined) {
        const engineSize = parseOptionalNumber(normalized.Engine_Size);
        if (engineSize !== undefined) normalized.engine_size = engineSize;
    }

    if (normalized.max_load !== undefined && normalized.capacity === undefined) {
        const capacity = parseOptionalNumber(normalized.max_load);
        if (capacity !== undefined) normalized.capacity = capacity;
    }

    if (normalized.Active !== undefined && normalized.is_active === undefined) {
        normalized.is_active = parseBoolean(normalized.Active, true);
    }

    const explicitStatus = normalizeVehicleStatus(normalized.status);
    const needsMaintenance = parseBoolean(
        normalized.Need_Maintenance ??
        normalized.need_maintenance ??
        normalized.needMaintenance ??
        normalized.needsMaintenance,
        undefined
    );
    const isActive = parseBoolean(normalized.is_active ?? normalized.Active ?? normalized.active, undefined);

    if (explicitStatus) {
        normalized.status = explicitStatus;
    } else if (needsMaintenance === true) {
        normalized.status = 'IN_MAINTENANCE';
    } else if (isActive === false) {
        normalized.status = 'OUT_OF_SERVICE';
    } else if (isActive === true || needsMaintenance === false) {
        normalized.status = 'AVAILABLE';
    }

    if (normalized.status === 'IN_MAINTENANCE') {
        normalized.is_active = true;
    } else if (normalized.status === 'OUT_OF_SERVICE') {
        normalized.is_active = false;
    } else if (normalized.status === 'AVAILABLE' && normalized.is_active === undefined) {
        normalized.is_active = true;
    }

    // Strip frontend compatibility aliases so Sequelize only receives model columns.
    delete normalized.type;
    delete normalized.Vehicle_Model;
    delete normalized.Mileage;
    delete normalized.Vehicle_Age;
    delete normalized.Engine_Size;
    delete normalized.max_load;
    delete normalized.consumption;
    delete normalized.Active;
    delete normalized.Need_Maintenance;
    delete normalized.need_maintenance;
    delete normalized.needMaintenance;
    delete normalized.needsMaintenance;
    delete normalized.Tire_Condition;
    delete normalized.Brake_Condition;
    delete normalized.Battery_Status;
    delete normalized.active;

    return normalized;
};

const deriveVehicleStatusFromState = (vehicle, ongoingVehicleIds) => {
    if (ongoingVehicleIds.has(String(vehicle.id))) {
        return 'ON_TRIP';
    }

    if (vehicle.status === 'IN_MAINTENANCE') {
        return 'IN_MAINTENANCE';
    }

    if (vehicle.is_active === false) {
        return 'OUT_OF_SERVICE';
    }

    return 'AVAILABLE';
};

const reconcileVehicleStatusesFromTrips = async (vehicleIds = null) => {
    const vehicleWhere = Array.isArray(vehicleIds) && vehicleIds.length > 0
        ? { id: { [Op.in]: vehicleIds } }
        : undefined;

    const [vehicles, ongoingTrips] = await Promise.all([
        Vehicle.findAll({ where: vehicleWhere }),
        Trip.findAll({
            where: {
                status: 'ongoing',
                ...(vehicleWhere ? { vehicleId: { [Op.in]: vehicleIds } } : {}),
            },
            attributes: ['vehicleId'],
        }),
    ]);

    const ongoingVehicleIds = new Set(
        ongoingTrips
            .map((trip) => trip.vehicleId)
            .filter(Boolean)
            .map((id) => String(id))
    );

    await Promise.all(
        vehicles.map(async (vehicle) => {
            const desiredStatus = deriveVehicleStatusFromState(vehicle, ongoingVehicleIds);
            if (vehicle.status !== desiredStatus) {
                await vehicle.update({ status: desiredStatus });
            }
        })
    );
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
    return await Vehicle.create(normalizeVehiclePayload(data));
};

// ─────────────────────────────────────────────
// Read
// ─────────────────────────────────────────────

// Builds the display label for a vehicle — must match the frontend DriverForm label logic exactly.
const buildVehicleLabel = (v) =>
    v.plaque_immatriculation ? `${v.name} (${v.plaque_immatriculation})` : v.name;

/**
 * Returns vehicles eligible to be assigned to a driver:
 *   - status === 'AVAILABLE' AND not already assigned to another driver
 *   - PLUS the vehicle currently held by currentDriverId (edit-mode safety net)
 *
 * @param {string|null} currentDriverId  Pass the driver being edited so their
 *   current vehicle stays in the list even if it is not AVAILABLE.
 */
export const getAvailableVehicles = async (currentDriverId = null) => {
    await reconcileVehicleStatusesFromTrips();

    // Parallel: all vehicles + other drivers' assignments + current driver's assignment
    const [allVehicles, driversWithVehicles, currentDriver] = await Promise.all([
        Vehicle.findAll({ order: [['createdAt', 'DESC']] }),
        User.findAll({
            where: {
                role: 'DRIVER',
                assignedVehicle: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
                ...(currentDriverId ? { id: { [Op.ne]: currentDriverId } } : {}),
            },
            attributes: ['assignedVehicle'],
            raw: true,
        }),
        currentDriverId
            ? User.findByPk(currentDriverId, { attributes: ['assignedVehicle'], raw: true })
            : Promise.resolve(null),
    ]);

    const takenLabels = new Set(driversWithVehicles.map((d) => d.assignedVehicle).filter(Boolean));
    const currentVehicleLabel = currentDriver?.assignedVehicle ?? null;

    return allVehicles.filter((v) => {
        const label = buildVehicleLabel(v);
        const isAvailableAndFree = v.status === 'AVAILABLE' && !takenLabels.has(label);
        const isCurrentDriverVehicle = Boolean(currentVehicleLabel && label === currentVehicleLabel);
        return isAvailableAndFree || isCurrentDriverVehicle;
    });
};

export const getAllVehicles = async (query = {}, cacheKey = null) => {
    await reconcileVehicleStatusesFromTrips();
    const { page, limit, offset } = getPagination(query);

    const { count, rows } = await Vehicle.findAndCountAll({
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });

    return getPagingData(count, rows, page, limit);
};

export const getVehicleById = async (id, cacheKey = null) => {
    await reconcileVehicleStatusesFromTrips([id]);
    return await Vehicle.findByPk(id);
};

// ─────────────────────────────────────────────
// Update — with full notification triggers
// ─────────────────────────────────────────────

export const updateVehicle = async (id, data) => {
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) return null;

    const normalizedData = normalizeVehiclePayload(data);
    const previousStatus = vehicle.status;
    const previousDriverId = vehicle.driverId ?? null;

    const updatedVehicle = await vehicle.update(normalizedData);

    // Resolve manager once, reuse across all events below
    const managerId = await resolveManagerId(updatedVehicle);

    // ── Driver assigned ──────────────────────────────────────────────────
    if (normalizedData?.driverId && normalizedData.driverId !== previousDriverId) {
        publishSafely(
            FLEET_EVENTS.DRIVER_ASSIGNED,
            {
                driverId: normalizedData.driverId,
                vehicle: updatedVehicle,
                tripId: normalizedData.tripId ?? null,
            },
            'DRIVER_ASSIGNED'
        );
    }

    // ── Driver unassigned ────────────────────────────────────────────────
    if (normalizedData?.driverId === null && previousDriverId) {
        publishSafely(
            FLEET_EVENTS.DRIVER_UNASSIGNED,
            {
                driverId: previousDriverId,
                vehicle: updatedVehicle,
                tripId: normalizedData.tripId ?? null,
            },
            'DRIVER_UNASSIGNED'
        );
    }

    // ── Status-change events ─────────────────────────────────────────────
    if (normalizedData?.status && normalizedData.status !== previousStatus) {
        const normalizedStatus = String(normalizedData.status).toUpperCase();

        if (normalizedStatus === 'OUT_OF_SERVICE') {
            publishSafely(
                FLEET_EVENTS.VEHICLE_BREAKDOWN,
                {
                    vehicle: updatedVehicle,
                    driverId: updatedVehicle.driverId ?? previousDriverId ?? null,
                    managerId,
                    location: normalizedData.location ?? null,
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

    // Normalize to plain object and fix legacy JSON-string fields
    const normalized = vehicle.toJSON();
    if (typeof normalized.reported_issues_text === 'string') {
        try { normalized.reported_issues_text = JSON.parse(normalized.reported_issues_text); }
        catch { normalized.reported_issues_text = []; }
    }

    // 1. Deterministic flags — fast, no API call needed
    const flags = computeMaintenanceFlags(normalized);

    const semanticPrompt = buildSemanticCachePrompt(vehicle);
    const semanticAttributes = {
        feature: 'maintenance-recommendation',
        vehicleId: String(vehicleId),
    };

    // 2. Check semantic cache
    const cached = await semanticSearch(semanticPrompt, { attributes: semanticAttributes });
    if (cached?.response) {
        try {
            const cacheParsed =
                typeof cached.response === 'string'
                    ? JSON.parse(cached.response)
                    : cached.response;
            const validated = validateAndFill(cacheParsed);
            const toStore = { ...validated, flags, generated_at: new Date().toISOString() };
            await vehicle.update({ maintenance_recommandation_ai: toStore });
            return toStore;
        } catch (err) {
            console.warn('[SemanticCache] Cached recommendation invalid, re-generating:', err.message);
        }
    }

    // 3. Build prompt with deterministic flags and call Gemini
    const prompt = buildCarPrompt(normalized, flags);
    const aiResult = await callGeminiAndParse(prompt);

    // 4. Validate and normalise Gemini output shape → { recommendations: [...] }
    const validated = validateAndFill(aiResult);

    // 5. Persist — store flags alongside for transparency
    const toStore = { ...validated, flags, generated_at: new Date().toISOString() };
    await vehicle.update({ maintenance_recommandation_ai: toStore });

    // 6. Cache the validated result
    await semanticSet(semanticPrompt, JSON.stringify(validated), { attributes: semanticAttributes });

    return toStore;
};
