import Notification from '../models/notification.model.js';


// CREATE
export const createNotificationService = async (data) => {
    return await Notification.create(data);
};


// GET ALL
export const getAllNotificationsService = async () => {
    return await Notification.findAll({
        order: [['createdAt', 'DESC']]
    });
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