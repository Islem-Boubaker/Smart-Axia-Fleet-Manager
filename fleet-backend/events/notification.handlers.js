import { Op } from "sequelize";
import { eventBus, FLEET_EVENTS } from "./eventBus.js";
import { NOTIFICATION_TYPES } from "../constants/notification.constants.js";
import Notification from "../models/notification.model.js";
import Trip from "../models/trip.model.js";
import User from "../models/user.model.js";
import { getIO } from "../config/socket.js";

const emitSocketNotification = (userId, notification) => {
  try {
    const io = getIO();
    io.to(String(userId)).emit("notification:new", notification);
    io.to(`user:${userId}`).emit("notification:new", notification);
  } catch {
    // Socket server may not be initialised yet during startup tests.
  }
};

const createNotification = async (payload) => {
  const notification = await Notification.create(payload);
  emitSocketNotification(payload.userId, notification.toJSON());
  return notification;
};

const getManagerAndAdminIds = async () => {
  const users = await User.findAll({
    where: {
      role: {
        [Op.in]: ["ADMIN", "MANAGER"],
      },
    },
    attributes: ["id"],
  });

  return users.map((user) => user.id);
};

eventBus.subscribe(FLEET_EVENTS.TRIP_ASSIGNED, async ({ payload }) => {
  const trip = await Trip.findByPk(payload.tripId);
  if (!trip) return;

  const notification = await createNotification({
    userId: payload.userId,
    type: NOTIFICATION_TYPES.TRIP_ASSIGNED,
    title: "New Trip Assigned",
    message: `You have been assigned to trip from ${trip.startLocation} to ${trip.endLocation}.`,
    entityId: payload.tripId,
    entityType: "trip",
    metadata: {
      referenceId: payload.tripId,
      referenceType: "trip",
    },
  });

  emitSocketNotification(payload.userId, notification.toJSON());
});

eventBus.subscribe(FLEET_EVENTS.TRIP_STARTED, async ({ payload }) => {
  const recipientIds = await getManagerAndAdminIds();
  if (!recipientIds.length) return;

  await Notification.bulkCreate(
    recipientIds.map((userId) => ({
      userId,
      type: NOTIFICATION_TYPES.TRIP_STARTED,
      title: "Trip Started",
      message: `Trip ${payload.tripId} has started.`,
      entityId: payload.tripId,
      entityType: "trip",
      metadata: { referenceId: payload.tripId, referenceType: "trip" },
    }))
  );
});

eventBus.subscribe(FLEET_EVENTS.TRIP_COMPLETED, async ({ payload }) => {
  const recipientIds = await getManagerAndAdminIds();
  if (!recipientIds.length) return;

  await Notification.bulkCreate(
    recipientIds.map((userId) => ({
      userId,
      type: NOTIFICATION_TYPES.TRIP_COMPLETED,
      title: "Trip Completed",
      message: `Trip ${payload.tripId} has been completed.`,
      entityId: payload.tripId,
      entityType: "trip",
      metadata: { referenceId: payload.tripId, referenceType: "trip" },
    }))
  );
});

eventBus.subscribe(FLEET_EVENTS.TRIP_CANCELLED, async ({ payload }) => {
  const trip = await Trip.findByPk(payload.tripId);
  if (!trip) return;

  const managerIds = await getManagerAndAdminIds();
  const recipients = [...new Set([trip.userId, ...managerIds].filter(Boolean))];

  if (!recipients.length) return;

  await Notification.bulkCreate(
    recipients.map((userId) => ({
      userId,
      type: NOTIFICATION_TYPES.TRIP_CANCELLED,
      title: "Trip Cancelled",
      message: `Trip ${payload.tripId} has been cancelled.`,
      entityId: payload.tripId,
      entityType: "trip",
      metadata: { referenceId: payload.tripId, referenceType: "trip" },
    }))
  );
});

eventBus.on("maintenance:created", async ({ maintenance, vehicle }) => {
  const recipients = await getManagerAndAdminIds();
  if (!recipients.length) return;

  await Notification.bulkCreate(
    recipients.map((userId) => ({
      userId,
      type: NOTIFICATION_TYPES.MAINTENANCE_SCHEDULED,
      title: "Maintenance Scheduled",
      message: `Vehicle ${vehicle?.plaque_immatriculation ?? maintenance?.vehiclePlate ?? maintenance?.vehicleId} has maintenance scheduled for ${new Date(maintenance.scheduledDate).toLocaleDateString()}.`,
      entityId: maintenance.id,
      entityType: "maintenance",
      metadata: { referenceId: maintenance.id, referenceType: "Maintenance" },
    }))
  );
});

eventBus.on("maintenance:started", async ({ maintenance, vehicle }) => {
  const recipients = await getManagerAndAdminIds();
  if (!recipients.length) return;

  await Notification.bulkCreate(
    recipients.map((userId) => ({
      userId,
      type: NOTIFICATION_TYPES.MAINTENANCE_STARTED,
      title: "Maintenance In Progress",
      message: `Maintenance has started on vehicle ${vehicle?.plaque_immatriculation ?? maintenance?.vehiclePlate ?? maintenance?.vehicleId}. Vehicle is temporarily unavailable.`,
      entityId: maintenance.id,
      entityType: "maintenance",
      metadata: { referenceId: maintenance.id, referenceType: "Maintenance" },
    }))
  );
});

eventBus.on("maintenance:completed", async ({ maintenance, vehicle }) => {
  const recipients = await getManagerAndAdminIds();
  if (!recipients.length) return;

  await Notification.bulkCreate(
    recipients.map((userId) => ({
      userId,
      type: NOTIFICATION_TYPES.MAINTENANCE_COMPLETED,
      title: "Maintenance Completed",
      message: `Vehicle ${vehicle?.plaque_immatriculation ?? maintenance?.vehiclePlate ?? maintenance?.vehicleId} maintenance is complete and the vehicle is now available.`,
      entityId: maintenance.id,
      entityType: "maintenance",
      metadata: { referenceId: maintenance.id, referenceType: "Maintenance" },
    }))
  );
});

eventBus.on("maintenance:cancelled", async ({ maintenance, vehicle }) => {
  const recipients = await getManagerAndAdminIds();
  if (!recipients.length) return;

  await Notification.bulkCreate(
    recipients.map((userId) => ({
      userId,
      type: NOTIFICATION_TYPES.MAINTENANCE_CANCELLED,
      title: "Maintenance Cancelled",
      message: `Maintenance for vehicle ${vehicle?.plaque_immatriculation ?? maintenance?.vehiclePlate ?? maintenance?.vehicleId} has been cancelled.`,
      entityId: maintenance.id,
      entityType: "maintenance",
      metadata: { referenceId: maintenance.id, referenceType: "Maintenance" },
    }))
  );
});
