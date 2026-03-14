import Notification from '../models/notification.model.js';
import { getPagination, getPagingData } from '../utils/pagination.js';

const byUser = (user) => (user?.id ? { userId: user.id } : {});


// CREATE
export const createNotificationService = async (data) => {
    return await Notification.create(data);
};


    // GET ALL
    export const getAllNotificationsService = async (query = {}, user) => {
        const { page, limit, offset } = getPagination(query);
        const { count, rows } = await Notification.findAndCountAll({
            where: byUser(user),
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });
        return getPagingData(count, rows, page, limit);
    };


// GET BY ID
export const getNotificationByIdService = async (id, user) => {
    return await Notification.findOne({ where: { id, ...byUser(user) } });
};


// UPDATE
export const updateNotificationService = async (id, data, user) => {
    const notification = await Notification.findOne({ where: { id, ...byUser(user) } });

    if (!notification) return null;

    await notification.update(data);

    return notification;
};


// DELETE
export const deleteNotificationService = async (id, user) => {
    const notification = await Notification.findOne({ where: { id, ...byUser(user) } });

    if (!notification) return null;

    await notification.destroy();

    return true;
};


// MARK AS READ
export const markNotificationAsReadService = async (id, user) => {
    const notification = await Notification.findOne({ where: { id, ...byUser(user) } });

    if (!notification) return null;

    await notification.update({ read: true, readAt: new Date() });

    return notification;
};

export const markNotificationAsUnreadService = async (id, user) => {
    const notification = await Notification.findOne({ where: { id, ...byUser(user) } });

    if (!notification) return null;

    await notification.update({ read: false, readAt: null });

    return notification;
};

export const getNotificationsByTypeService = async (type, user, query = {}) => {
    const { page, limit, offset } = getPagination(query);
    const { count, rows } = await Notification.findAndCountAll({
        where: { type, ...byUser(user) },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });
    return getPagingData(count, rows, page, limit);
};

export const markAllNotificationsAsReadService = async (user) => {
    const where = byUser(user);
    const [updatedCount] = await Notification.update(
        { read: true, readAt: new Date() },
        { where: { ...where, read: false } }
    );
    return { updatedCount };
};

export const getUnreadCountService = async (user) => {
    const where = byUser(user);
    return Notification.count({ where: { ...where, read: false } });
};

export const clearReadNotificationsService = async (user) => {
    const where = byUser(user);
    const deletedCount = await Notification.destroy({ where: { ...where, read: true } });
    return { deletedCount };
};

export const clearAllNotificationsService = async (user) => {
    const where = byUser(user);
    const deletedCount = await Notification.destroy({ where });
    return { deletedCount };
};