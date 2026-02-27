import {
    createNotificationService,
    getAllNotificationsService,
    getNotificationByIdService,
    updateNotificationService,
    deleteNotificationService,
    markNotificationAsReadService
} from '../services/notification.service.js';


// CREATE
export const createNotification = async (req, res) => {
    try {

        const notification = await createNotificationService(req.body);

        res.status(201).json({
            success: true,
            data: notification
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


// GET ALL
export const getAllNotifications = async (req, res) => {
    try {

        const notifications = await getAllNotificationsService();

        res.status(200).json({
            success: true,
            data: notifications
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


// GET ONE
export const getNotificationById = async (req, res) => {
    try {

        const notification = await getNotificationByIdService(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            data: notification
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


// UPDATE
export const updateNotification = async (req, res) => {
    try {

        const notification = await updateNotificationService(
            req.params.id,
            req.body
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            data: notification
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


// DELETE
export const deleteNotification = async (req, res) => {
    try {

        const deleted = await deleteNotificationService(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};


// MARK AS READ
export const markAsRead = async (req, res) => {
    try {

        const notification = await markNotificationAsReadService(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            data: notification
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};