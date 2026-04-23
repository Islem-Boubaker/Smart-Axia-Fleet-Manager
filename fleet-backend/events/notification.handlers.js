import { Op } from "sequelize";
import { eventBus, FLEET_EVENTS } from "./eventBus.js";
import { NOTIFICATION_TYPES } from "../constants/notification.constants.js";
import Notification from "../models/notification.model.js";
import Trip from "../models/trip.model.js";
import User from "../models/user.model.js";
import Vehicle from "../models/vehicle.model.js";
import { getIO } from "../config/socket.js";
import nodemailer from "nodemailer";
import NotificationService from "../services/notification.service.js";

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
  if (!Array.isArray(users) || users.length === 0) return;
  if (!transporter) {
    console.warn("[NotificationHandlers] Email skipped: transporter not configured.");
    return;
  }

  const targets = users.filter((user) => Boolean(user?.email));
  if (!targets.length) {
    console.warn("[NotificationHandlers] Email skipped: no recipients with email.");
    return;
  }

  const results = await Promise.allSettled(
    targets.map((user) => {
      const text = `Hello ${user.name ?? "there"},\n\n${message}\n\nAXIA Fleet Manager`;

      return transporter.sendMail({
        from: `"AXIA Fleet Manager" <${EMAIL_FROM}>`,
        to: user.email,
        subject,
        text,
      });
    })
  );

  const failed = results
    .map((result, index) => ({ result, recipient: targets[index]?.email }))
    .filter(({ result }) => result.status === "rejected");

  if (failed.length) {
    console.error("[NotificationHandlers] Email send failures:",
      failed.map(({ recipient, result }) => ({
        recipient,
        error: result.reason?.message || String(result.reason),
      }))
    );
    return;
  }

  console.info(`[NotificationHandlers] Email sent to ${targets.length} recipient(s).`);
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

const getAlertRecipients = async () => {
  return User.findAll({
    where: {
      role: {
        [Op.in]: ["ADMIN", "MANAGER"],
      },
      isActive: true,
    },
    attributes: ["id", "name", "email", "emailMaintenance", "pushAlerts", "expoPushToken"],
  });
};

const startOfToday = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start;
};

const daysUntil = (value) => {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - startOfToday().getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
};

const formatDate = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB");
};

const vehicleLabel = (vehicle) => {
  return vehicle?.plaque_immatriculation
    ? `${vehicle?.name ?? "Vehicle"} - ${vehicle.plaque_immatriculation}`
    : vehicle?.name ?? "Vehicle";
};

const findExistingAlertRecipients = async ({ recipientIds, type, entityId }) => {
  if (!recipientIds.length) return new Set();

  const existing = await Notification.findAll({
    where: {
      userId: { [Op.in]: recipientIds },
      type,
      entityType: "vehicle",
      entityId,
      isArchived: false,
      readAt: null,
      [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }],
    },
    attributes: ["userId"],
    raw: true,
  });

  return new Set(existing.map((row) => String(row.userId)));
};

const dispatchVehicleDocumentExpiryAlert = async ({
  vehicle,
  type,
  title,
  message,
  expiresAt,
  overdue,
}) => {
  const recipients = await getAlertRecipients();
  if (!recipients.length) return;

  const recipientIds = recipients.map((user) => user.id);
  const alreadyAlerted = await findExistingAlertRecipients({
    recipientIds,
    type,
    entityId: vehicle.id,
  });

  const targetRecipients = recipients.filter((user) => !alreadyAlerted.has(String(user.id)));
  if (!targetRecipients.length) return;

  const notifications = await Notification.bulkCreate(
    targetRecipients.map((user) => ({
      userId: user.id,
      type,
      title,
      message,
      entityType: "vehicle",
      entityId: vehicle.id,
      metadata: {
        referenceId: vehicle.id,
        referenceType: "vehicle",
        plate: vehicle.plaque_immatriculation ?? null,
        name: vehicle.name,
        expiresAt,
      },
      expiresAt,
      priority: overdue ? "critical" : "high",
      group: "maintenance",
    }))
  );

  emitBulkSocketNotifications(notifications);

  const emailRecipients = targetRecipients.filter((user) => user.email && user.emailMaintenance);
  await sendEmailToUsers(emailRecipients, {
    subject: title,
    message,
  });

  const notificationByUserId = new Map(notifications.map((item) => [String(item.userId), item]));
  const pushRecipients = targetRecipients.filter((user) => user.pushAlerts && user.expoPushToken);

  await Promise.allSettled(
    pushRecipients.map((user) => {
      const notification = notificationByUserId.get(String(user.id));
      if (!notification || !user.expoPushToken) return Promise.resolve();
      return NotificationService.sendExpoPush(user.expoPushToken, notification);
    })
  );
};

export const runVehicleDocumentExpiryNotifications = async () => {
  const vehicles = await Vehicle.findAll({
    where: {
      Active: true,
    },
    attributes: [
      "id",
      "name",
      "plaque_immatriculation",
      "insurance_expiry_date",
      "tech_visit_expiry_date",
    ],
  });

  for (const vehicle of vehicles) {
    const insuranceDays = daysUntil(vehicle.insurance_expiry_date);
    if (insuranceDays !== null && insuranceDays <= 7) {
      const overdue = insuranceDays < 0;
      const when = overdue ? `${Math.abs(insuranceDays)} day(s) overdue` : `due in ${insuranceDays} day(s)`;
      const expiresOn = formatDate(vehicle.insurance_expiry_date);

      await dispatchVehicleDocumentExpiryAlert({
        vehicle,
        type: NOTIFICATION_TYPES.VEHICLE_INSURANCE_EXPIRY,
        title: overdue
          ? `Insurance overdue - ${vehicleLabel(vehicle)}`
          : `Insurance due soon - ${vehicleLabel(vehicle)}`,
        message: `${vehicleLabel(vehicle)} insurance expires on ${expiresOn} (${when}).`,
        expiresAt: vehicle.insurance_expiry_date,
        overdue,
      });
    }

    const techVisitDays = daysUntil(vehicle.tech_visit_expiry_date);
    if (techVisitDays !== null && techVisitDays <= 7) {
      const overdue = techVisitDays < 0;
      const when = overdue ? `${Math.abs(techVisitDays)} day(s) overdue` : `due in ${techVisitDays} day(s)`;
      const expiresOn = formatDate(vehicle.tech_visit_expiry_date);

      await dispatchVehicleDocumentExpiryAlert({
        vehicle,
        type: NOTIFICATION_TYPES.VEHICLE_TECH_VISIT_EXPIRY,
        title: overdue
          ? `Tech visit overdue - ${vehicleLabel(vehicle)}`
          : `Tech visit due soon - ${vehicleLabel(vehicle)}`,
        message: `${vehicleLabel(vehicle)} technical visit expires on ${expiresOn} (${when}).`,
        expiresAt: vehicle.tech_visit_expiry_date,
        overdue,
      });
    }
  }
};

if (process.env.NODE_ENV !== "test") {
  setTimeout(() => {
    runVehicleDocumentExpiryNotifications().catch((error) => {
      console.error("[NotificationHandlers] Vehicle document expiry scan failed:", error.message);
    });
  }, 5_000);

  setInterval(() => {
    runVehicleDocumentExpiryNotifications().catch((error) => {
      console.error("[NotificationHandlers] Vehicle document expiry scan failed:", error.message);
    });
  }, 6 * 60 * 60 * 1000);
}

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

const getSystemNotificationRecipients = async (recipientIds = []) => {
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) return [];

  return User.findAll({
    where: {
      id: { [Op.in]: recipientIds },
      isActive: true,
    },
    attributes: ["id", "name", "email", "role", "expoPushToken", "pushAlerts"],
  });
};

const isAdminOrManager = (user) => ["ADMIN", "MANAGER"].includes(user?.role);

const buildSystemActionUrl = (payload) => {
  const reclamationId = payload?.metadata?.reclamationId;
  if (reclamationId) {
    return `/driver-issues?reclamationId=${encodeURIComponent(String(reclamationId))}`;
  }
  return null;
};

const dispatchSystemEventNotifications = async ({ payload, type }) => {
  const recipients = await getSystemNotificationRecipients(payload?.recipientIds || []);
  if (!recipients.length) return;

  const actionUrl = buildSystemActionUrl(payload);
  const notifications = await Notification.bulkCreate(
    recipients.map((user) => ({
      userId: user.id,
      type,
      title: payload?.title || "System notification",
      message: payload?.message || "A system update is available.",
      entityType: payload?.metadata?.reclamationId ? "reclamation" : null,
      entityId: payload?.metadata?.reclamationId || null,
      actionUrl,
      metadata: payload?.metadata || {},
    }))
  );

  emitBulkSocketNotifications(notifications);

  const targetAdminsManagers = recipients.filter(isAdminOrManager);
  const emailRecipients = targetAdminsManagers.filter((user) => user.email);

  await sendEmailToUsers(emailRecipients, {
    subject: payload?.title || "System notification",
    message: payload?.message || "A system update is available.",
  });

  const notificationByUserId = new Map(notifications.map((item) => [String(item.userId), item]));
  const pushRecipients = recipients.filter((user) => user.expoPushToken && user.pushAlerts !== false);

  if (!pushRecipients.length) {
    console.warn("[NotificationHandlers] Push skipped: no recipients with Expo token.");
  }

  const pushResults = await Promise.allSettled(
    pushRecipients.map((user) => {
      const notification = notificationByUserId.get(String(user.id));
      if (!notification || !user.expoPushToken) return Promise.resolve();
      return NotificationService.sendExpoPush(user.expoPushToken, notification);
    })
  );

  const failedPush = pushResults.filter((result) => result.status === "rejected");
  if (failedPush.length) {
    console.error(`[NotificationHandlers] Push send failures: ${failedPush.length}`);
  }
};

eventBus.subscribe(FLEET_EVENTS.SYSTEM_ALERT, async ({ payload }) => {
  await dispatchSystemEventNotifications({
    payload,
    type: NOTIFICATION_TYPES.SYSTEM_ALERT,
  });
});

eventBus.subscribe(FLEET_EVENTS.SYSTEM_UPDATE, async ({ payload }) => {
  await dispatchSystemEventNotifications({
    payload,
    type: NOTIFICATION_TYPES.SYSTEM_UPDATE,
  });
});
