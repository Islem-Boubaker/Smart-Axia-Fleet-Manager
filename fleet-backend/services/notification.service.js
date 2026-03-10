import Notification from '../models/notification.model.js';
import { getPagination, getPagingData } from '../utils/pagination.js';


// CREATE
export const createNotificationService = async (data) => {
    return await Notification.create(data);
};


    // GET ALL
    export const getAllNotificationsService = async (query = {}) => {
        const { page, limit, offset } = getPagination(query);
        const { count, rows } = await Notification.findAndCountAll({
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });
        return getPagingData(count, rows, page, limit);
    };


// GET BY ID
export const getNotificationByIdService = async (id) => {
    return await Notification.findByPk(id);
};


// UPDATE
export const updateNotificationService = async (id, data) => {
    const notification = await Notification.findByPk(id);

    if (!notification) return null;

    await notification.update(data);

    return notification;
};


// DELETE
export const deleteNotificationService = async (id) => {
    const notification = await Notification.findByPk(id);

    if (!notification) return null;

    await notification.destroy();

    return true;
};


// MARK AS READ
export const markNotificationAsReadService = async (id) => {
    const notification = await Notification.findByPk(id);

    if (!notification) return null;

    await notification.update({ read: true });

    return notification;
};