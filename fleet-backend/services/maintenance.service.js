import Maintenance from '../models/maintenance.model.js';
import { getPagination, getPagingData } from '../utils/pagination.js';
import { eventBus, FLEET_EVENTS } from '../events/eventBus.js';


// CREATE
export const createMaintenanceService = async (data) => {
    const managerId = data?.managerId ?? null;
    const maintenance = await Maintenance.create(data);

    try {
        eventBus.emitEvent(FLEET_EVENTS.MAINTENANCE_SCHEDULED, {
            vehicle: { id: maintenance.vehicle ?? data?.vehicle ?? null },
            managerId,
            scheduledAt: maintenance.date ?? new Date().toISOString(),
            maintenanceId: maintenance.id ?? maintenance._id?.toString(),
        });
    } catch (err) {
        console.error('[EventBus] MAINTENANCE_SCHEDULED publish failed:', err);
    }

    return maintenance;
};


// GET ALL
export const getAllMaintenancesService = async (query = {}) => {
    const { page, limit, offset } = getPagination(query);
    const { count, rows } = await Maintenance.findAndCountAll({
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });
    return getPagingData(count, rows, page, limit);
};


// GET BY ID
export const getMaintenanceByIdService = async (id) => {
    return await Maintenance.findByPk(id);
};


// UPDATE
export const updateMaintenanceService = async (id, data) => {

    const maintenance = await Maintenance.findByPk(id);

    if (!maintenance) return null;

    await maintenance.update(data);

    return maintenance;
};


// DELETE
export const deleteMaintenanceService = async (id) => {

    const maintenance = await Maintenance.findByPk(id);

    if (!maintenance) return null;

    await maintenance.destroy();

    return true;
};


// UPDATE STATUS
export const updateMaintenanceStatusService = async (id, status) => {

    const maintenance = await Maintenance.findByPk(id);

    if (!maintenance) return null;

    await maintenance.update({ status });

    if (status === 'completed') {
        try {
            eventBus.emitEvent(FLEET_EVENTS.MAINTENANCE_COMPLETED, {
                vehicle: { id: maintenance.vehicle ?? null },
                managerId: maintenance.managerId ?? null,
                maintenanceId: maintenance.id ?? maintenance._id?.toString(),
            });
        } catch (err) {
            console.error('[EventBus] MAINTENANCE_COMPLETED publish failed:', err);
        }
    }

    return maintenance;
};

export const checkOverdueMaintenanceService = async () => {
    const now = new Date();
    const overdueItems = await Maintenance.find({
        status: { $ne: 'completed' },
        date: { $lt: now },
    });

    for (const maintenance of overdueItems) {
        const scheduledAt = new Date(maintenance.date);
        const overdueBy = Math.max(
            1,
            Math.floor((now.getTime() - scheduledAt.getTime()) / (1000 * 60 * 60 * 24))
        );

        try {
            eventBus.emitEvent(FLEET_EVENTS.MAINTENANCE_OVERDUE, {
                vehicle: { id: maintenance.vehicle ?? null },
                managerId: maintenance.managerId ?? null,
                overdueBy,
                maintenanceId: maintenance.id ?? maintenance._id?.toString(),
            });
        } catch (err) {
            console.error('[EventBus] MAINTENANCE_OVERDUE publish failed:', err);
        }
    }

    return overdueItems;
};