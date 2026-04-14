import { Op } from "sequelize";
import { eventBus, FLEET_EVENTS } from "./eventBus.js";
import { NOTIFICATION_TYPES } from "../constants/notification.constants.js";
import Notification from "../models/notification.model.js";
import Trip from "../models/trip.model.js";
import User from "../models/user.model.js";
import { getIO } from "../config/socket.js";
import nodemailer from "nodemailer";

const EMAIL_FROM = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const transporter =
  EMAIL_FROM && EMAIL_PASS
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: EMAIL_FROM,
          pass: EMAIL_PASS,
        },
      })
    : null;

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

const emitBulkSocketNotifications = (notifications = []) => {
  for (const notification of notifications) {
    const payload = typeof notification.toJSON === "function" ? notification.toJSON() : notification;
    emitSocketNotification(payload.userId, payload);
  }
};

const sendEmailToUsers = async (users, { subject, message }) => {
  if (!transporter || !Array.isArray(users) || users.length === 0) return;

  await Promise.allSettled(
    users.map((user) => {
      if (!user?.email) return Promise.resolve();

      const text = `Hello ${user.name ?? "there"},\n\n${message}\n\nAXIA Fleet Manager`;

      return transporter.sendMail({
        from: `"AXIA Fleet Manager" <${EMAIL_FROM}>`,
        to: user.email,
        subject,
        text,
      });
    })
  );
};

const getUsersWithEmailPreference = async (userIds = [], preferenceKey) => {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];

  const where = {
    id: { [Op.in]: userIds },
    isActive: true,
    email: {
      [Op.ne]: null,
    },
  };

  if (preferenceKey) {
    where[preferenceKey] = true;
  }

  return User.findAll({
    where,
    attributes: ["id", "name", "email"],
  });
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

  await createNotification({
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

  const emailRecipients = await getUsersWithEmailPreference([payload.userId], "emailTrips");
  await sendEmailToUsers(emailRecipients, {
    subject: "New Trip Assigned",
    message: `You have been assigned to a trip from ${trip.startLocation} to ${trip.endLocation}.`,
  });
});

eventBus.subscribe(FLEET_EVENTS.TRIP_STARTED, async ({ payload }) => {
  const recipientIds = await getManagerAndAdminIds();
  if (!recipientIds.length) return;

  const notifications = await Notification.bulkCreate(
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

  emitBulkSocketNotifications(notifications);

  const emailRecipients = await getUsersWithEmailPreference(recipientIds, "emailTrips");
  await sendEmailToUsers(emailRecipients, {
    subject: "Trip Started",
    message: `Trip ${payload.tripId} has started.`,
  });
});

eventBus.subscribe(FLEET_EVENTS.TRIP_COMPLETED, async ({ payload }) => {
  const recipientIds = await getManagerAndAdminIds();
  if (!recipientIds.length) return;

  const notifications = await Notification.bulkCreate(
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

  emitBulkSocketNotifications(notifications);

  const emailRecipients = await getUsersWithEmailPreference(recipientIds, "emailTrips");
  await sendEmailToUsers(emailRecipients, {
    subject: "Trip Completed",
    message: `Trip ${payload.tripId} has been completed.`,
  });
});

eventBus.subscribe(FLEET_EVENTS.TRIP_CANCELLED, async ({ payload }) => {
  const trip = await Trip.findByPk(payload.tripId);
  if (!trip) return;

  const managerIds = await getManagerAndAdminIds();
  const recipients = [...new Set([trip.userId, ...managerIds].filter(Boolean))];

  if (!recipients.length) return;

  const notifications = await Notification.bulkCreate(
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

  emitBulkSocketNotifications(notifications);

  const emailRecipients = await getUsersWithEmailPreference(recipients, "emailTrips");
  await sendEmailToUsers(emailRecipients, {
    subject: "Trip Cancelled",
    message: `Trip ${payload.tripId} has been cancelled.`,
  });
});

eventBus.subscribe(FLEET_EVENTS.DRIVER_ASSIGNED, async ({ payload }) => {
  const managerIds = await getManagerAndAdminIds();
  const recipients = [...new Set([payload.driverId, ...managerIds].filter(Boolean))];
  if (!recipients.length) return;

  const vehicleLabel =
    payload?.vehicle?.plaque_immatriculation ?? payload?.vehicle?.name ?? payload?.vehicle?.id ?? "vehicle";

  const notifications = await Notification.bulkCreate(
    recipients.map((userId) => ({
      userId,
      type: NOTIFICATION_TYPES.DRIVER_ASSIGNED,
      title: "Driver Assigned",
      message: `A driver has been assigned to ${vehicleLabel}.`,
      entityId: payload?.tripId ?? payload?.vehicle?.id ?? null,
      entityType: payload?.tripId ? "trip" : "vehicle",
      metadata: {
        referenceId: payload?.tripId ?? payload?.vehicle?.id ?? null,
        referenceType: payload?.tripId ? "trip" : "vehicle",
      },
    }))
  );

  emitBulkSocketNotifications(notifications);

  const emailRecipients = await getUsersWithEmailPreference(recipients, "emailDrivers");
  await sendEmailToUsers(emailRecipients, {
    subject: "Driver Assignment Update",
    message: `A driver has been assigned to ${vehicleLabel}.`,
  });
});

eventBus.on("maintenance:created", async ({ maintenance, vehicle }) => {
  const recipients = await getManagerAndAdminIds();
  if (!recipients.length) return;

  const notifications = await Notification.bulkCreate(
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

  emitBulkSocketNotifications(notifications);

  const vehicleLabel = vehicle?.plaque_immatriculation ?? maintenance?.vehiclePlate ?? maintenance?.vehicleId;
  const emailRecipients = await getUsersWithEmailPreference(recipients, "emailMaintenance");
  await sendEmailToUsers(emailRecipients, {
    subject: "Maintenance Scheduled",
    message: `Vehicle ${vehicleLabel} has maintenance scheduled for ${new Date(maintenance.scheduledDate).toLocaleDateString()}.`,
  });
});

eventBus.on("maintenance:started", async ({ maintenance, vehicle }) => {
  const recipients = await getManagerAndAdminIds();
  if (!recipients.length) return;

  const notifications = await Notification.bulkCreate(
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

  emitBulkSocketNotifications(notifications);

  const vehicleLabel = vehicle?.plaque_immatriculation ?? maintenance?.vehiclePlate ?? maintenance?.vehicleId;
  const emailRecipients = await getUsersWithEmailPreference(recipients, "emailMaintenance");
  await sendEmailToUsers(emailRecipients, {
    subject: "Maintenance In Progress",
    message: `Maintenance has started on vehicle ${vehicleLabel}.`,
  });
});

eventBus.on("maintenance:completed", async ({ maintenance, vehicle }) => {
  const recipients = await getManagerAndAdminIds();
  if (!recipients.length) return;

  const notifications = await Notification.bulkCreate(
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

  emitBulkSocketNotifications(notifications);

  const vehicleLabel = vehicle?.plaque_immatriculation ?? maintenance?.vehiclePlate ?? maintenance?.vehicleId;
  const emailRecipients = await getUsersWithEmailPreference(recipients, "emailMaintenance");
  await sendEmailToUsers(emailRecipients, {
    subject: "Maintenance Completed",
    message: `Maintenance for vehicle ${vehicleLabel} has been completed.`,
  });
});

eventBus.on("maintenance:cancelled", async ({ maintenance, vehicle }) => {
  const recipients = await getManagerAndAdminIds();
  if (!recipients.length) return;

  const notifications = await Notification.bulkCreate(
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

  emitBulkSocketNotifications(notifications);

  const vehicleLabel = vehicle?.plaque_immatriculation ?? maintenance?.vehiclePlate ?? maintenance?.vehicleId;
  const emailRecipients = await getUsersWithEmailPreference(recipients, "emailMaintenance");
  await sendEmailToUsers(emailRecipients, {
    subject: "Maintenance Cancelled",
    message: `Maintenance for vehicle ${vehicleLabel} has been cancelled.`,
  });
});
