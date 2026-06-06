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
import {
  buildEmailAttachments,
  buildFleetEmailHtml,
  buildPlainTextEmail,
} from "../utils/emailTemplate.js";

const EMAIL_FROM = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const DEFAULT_ROUTE_DEVIATION_ALERT_THROTTLE_MS = 15 * 60 * 1000;

const getPositiveEnvNumber = (key, fallback) => {
  const parsed = Number(process.env[key]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const ROUTE_DEVIATION_ALERT_THROTTLE_MS = getPositiveEnvNumber(
  "ROUTE_DEVIATION_ALERT_THROTTLE_MS",
  DEFAULT_ROUTE_DEVIATION_ALERT_THROTTLE_MS
);

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
      const recipientName = user.name ?? "there";

      return transporter.sendMail({
        from: `"AXIA Fleet Manager" <${EMAIL_FROM}>`,
        to: user.email,
        subject,
        text: buildPlainTextEmail({ recipientName, message }),
        html: buildFleetEmailHtml({ recipientName, subject, message }),
        attachments: buildEmailAttachments(),
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

const getUsersWithPushPreference = async (userIds = [], preferenceKey) => {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];

  const where = {
    id: { [Op.in]: userIds },
    isActive: true,
    expoPushToken: {
      [Op.ne]: null,
    },
  };

  if (preferenceKey) {
    where[preferenceKey] = true;
  }

  return User.findAll({
    where,
    attributes: ["id", "name", "expoPushToken"],
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
    attributes: [
      "id",
      "name",
      "email",
      "emailMaintenance",
      "emailAI",
      "emailSystem",
      "pushMaintenance",
      "pushAI",
      "pushSystem",
      "pushAlerts",
      "expoPushToken",
    ],
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

const formatDateTime = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "unknown time";
  return d.toLocaleString("en-GB");
};

const formatDistance = (value) => {
  const distance = Number(value);
  if (!Number.isFinite(distance)) return "outside the configured route tolerance";
  if (distance >= 1000) return `${(distance / 1000).toFixed(1)} km`;
  return `${Math.round(distance)} m`;
};

const vehicleLabel = (vehicle, fallback = {}) => {
  const name = vehicle?.name || fallback.name || "";
  const plate = vehicle?.plaque_immatriculation || fallback.plate || "";

  if (name && plate) return `${name} (${plate})`;
  if (name) return name;
  if (plate) return `vehicle ${plate}`;
  return "the vehicle";
};

const documentMaintenanceType = (type) =>
  type === NOTIFICATION_TYPES.VEHICLE_INSURANCE_EXPIRY
    ? "Insurance Renewal"
    : "Technical Visit";

const documentMaintenanceCategory = (type) =>
  type === NOTIFICATION_TYPES.VEHICLE_INSURANCE_EXPIRY ? "insurance" : "tech-visit";

const buildVehicleDocumentMaintenanceActionUrl = ({ vehicle, type, message, expiresAt, overdue }) => {
  const maintenanceType = documentMaintenanceType(type);
  const params = new URLSearchParams({
    schedule: "1",
    source: "alert",
    vehicleId: String(vehicle.id),
    type: maintenanceType,
    priority: overdue ? "high" : "medium",
    technician: "Pending assignment",
    cost: "0",
    description: [
      `Created from ${maintenanceType.toLowerCase()} alert.`,
      "",
      message,
      "",
      `Vehicle: ${vehicleLabel(vehicle)}`,
      expiresAt ? `Current expiry date: ${formatDate(expiresAt)}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  if (vehicle.name) params.set("vehicleName", vehicle.name);
  if (vehicle.plaque_immatriculation) params.set("vehiclePlate", vehicle.plaque_immatriculation);

  return `/maintenance?${params.toString()}`;
};

const maintenanceVehicleLabel = (maintenance, vehicle) =>
  vehicleLabel(vehicle, { plate: maintenance?.vehiclePlate });

const userLabel = (user) => user?.name || user?.email || "the driver";

const getUserById = async (userId) => {
  if (!userId) return null;
  return User.findByPk(userId, { attributes: ["id", "name", "email"] });
};

const getTripNotificationContext = async (tripId) => {
  const trip = await Trip.findByPk(tripId, {
    include: [{ model: User, as: "driver", attributes: ["id", "name", "email"] }],
  });

  if (!trip) return null;

  const driver = trip.driver || (trip.userId ? await getUserById(trip.userId) : null);
  return {
    trip,
    driverName: userLabel(driver),
    route: `${trip.startLocation} to ${trip.endLocation}`,
  };
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

  const maintenanceType = documentMaintenanceType(type);
  const category = documentMaintenanceCategory(type);
  const actionUrl = buildVehicleDocumentMaintenanceActionUrl({
    vehicle,
    type,
    message,
    expiresAt,
    overdue,
  });

  const notifications = await Notification.bulkCreate(
    targetRecipients.map((user) => ({
      userId: user.id,
      type,
      title,
      message,
      entityType: "vehicle",
      entityId: vehicle.id,
      actionUrl,
      metadata: {
        referenceId: vehicle.id,
        referenceType: "vehicle",
        plate: vehicle.plaque_immatriculation ?? null,
        name: vehicle.name,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        vehiclePlate: vehicle.plaque_immatriculation ?? null,
        category,
        maintenanceType,
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
  const pushRecipients = targetRecipients.filter((user) => user.pushMaintenance && user.expoPushToken);

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
  const context = await getTripNotificationContext(payload.tripId);
  if (!context) return;
  const { trip, driverName, route } = context;

  await createNotification({
    userId: payload.userId,
    type: NOTIFICATION_TYPES.TRIP_ASSIGNED,
    title: "New Trip Assigned",
    message: `${driverName}, you have been assigned to a trip from ${route}.`,
    entityId: payload.tripId,
    entityType: "trip",
    actionUrl: buildTripActionUrl(payload.tripId),
    metadata: {
      referenceId: payload.tripId,
      referenceType: "trip",
      driverName,
    },
  });

  const emailRecipients = await getUsersWithEmailPreference([payload.userId], "emailTrips");
  await sendEmailToUsers(emailRecipients, {
    subject: "New Trip Assigned",
    message: `${driverName}, you have been assigned to a trip from ${route}.`,
  });

  const pushRecipients = await getUsersWithPushPreference([payload.userId], "pushTrips");
  const createdNotification = await Notification.findOne({
    where: {
      userId: payload.userId,
      type: NOTIFICATION_TYPES.TRIP_ASSIGNED,
      entityType: "trip",
      entityId: payload.tripId,
    },
    order: [["createdAt", "DESC"]],
  });

  await Promise.allSettled(
    pushRecipients.map((user) => {
      if (!createdNotification || !user.expoPushToken) return Promise.resolve();
      return NotificationService.sendExpoPush(user.expoPushToken, createdNotification);
    })
  );
});

eventBus.subscribe(FLEET_EVENTS.TRIP_STARTED, async ({ payload }) => {
  const context = await getTripNotificationContext(payload.tripId);
  if (!context) return;
  const { driverName, route } = context;
  const recipientIds = await getManagerAndAdminIds();
  if (!recipientIds.length) return;

  const notifications = await Notification.bulkCreate(
    recipientIds.map((userId) => ({
      userId,
      type: NOTIFICATION_TYPES.TRIP_STARTED,
      title: "Trip Started",
      message: `${driverName} started the trip from ${route}.`,
      entityId: payload.tripId,
      entityType: "trip",
      actionUrl: buildTripActionUrl(payload.tripId),
      metadata: { referenceId: payload.tripId, referenceType: "trip", driverName },
    }))
  );

  emitBulkSocketNotifications(notifications);

  const emailRecipients = await getUsersWithEmailPreference(recipientIds, "emailTrips");
  await sendEmailToUsers(emailRecipients, {
    subject: "Trip Started",
    message: `${driverName} started the trip from ${route}.`,
  });

  const notificationByUserId = new Map(notifications.map((item) => [String(item.userId), item]));
  const pushRecipients = await getUsersWithPushPreference(recipientIds, "pushTrips");
  await Promise.allSettled(
    pushRecipients.map((user) => {
      const notification = notificationByUserId.get(String(user.id));
      if (!notification || !user.expoPushToken) return Promise.resolve();
      return NotificationService.sendExpoPush(user.expoPushToken, notification);
    })
  );
});

eventBus.subscribe(FLEET_EVENTS.TRIP_COMPLETED, async ({ payload }) => {
  const context = await getTripNotificationContext(payload.tripId);
  if (!context) return;
  const { driverName, route } = context;
  const recipientIds = await getManagerAndAdminIds();
  if (!recipientIds.length) return;

  const notifications = await Notification.bulkCreate(
    recipientIds.map((userId) => ({
      userId,
      type: NOTIFICATION_TYPES.TRIP_COMPLETED,
      title: "Trip Completed",
      message: `${driverName} completed the trip from ${route}.`,
      entityId: payload.tripId,
      entityType: "trip",
      actionUrl: buildTripActionUrl(payload.tripId),
      metadata: { referenceId: payload.tripId, referenceType: "trip", driverName },
    }))
  );

  emitBulkSocketNotifications(notifications);

  const emailRecipients = await getUsersWithEmailPreference(recipientIds, "emailTrips");
  await sendEmailToUsers(emailRecipients, {
    subject: "Trip Completed",
    message: `${driverName} completed the trip from ${route}.`,
  });

  const notificationByUserId = new Map(notifications.map((item) => [String(item.userId), item]));
  const pushRecipients = await getUsersWithPushPreference(recipientIds, "pushTrips");
  await Promise.allSettled(
    pushRecipients.map((user) => {
      const notification = notificationByUserId.get(String(user.id));
      if (!notification || !user.expoPushToken) return Promise.resolve();
      return NotificationService.sendExpoPush(user.expoPushToken, notification);
    })
  );
});

eventBus.subscribe(FLEET_EVENTS.TRIP_CANCELLED, async ({ payload }) => {
  const context = await getTripNotificationContext(payload.tripId);
  if (!context) return;
  const { trip, driverName, route } = context;

  const managerIds = await getManagerAndAdminIds();
  const recipients = [...new Set([trip.userId, ...managerIds].filter(Boolean))];

  if (!recipients.length) return;

  const notifications = await Notification.bulkCreate(
    recipients.map((userId) => ({
      userId,
      type: NOTIFICATION_TYPES.TRIP_CANCELLED,
      title: "Trip Cancelled",
      message: `The trip from ${route} assigned to ${driverName} has been cancelled.`,
      entityId: payload.tripId,
      entityType: "trip",
      actionUrl: buildTripActionUrl(payload.tripId),
      metadata: { referenceId: payload.tripId, referenceType: "trip", driverName },
    }))
  );

  emitBulkSocketNotifications(notifications);

  const emailRecipients = await getUsersWithEmailPreference(recipients, "emailTrips");
  await sendEmailToUsers(emailRecipients, {
    subject: "Trip Cancelled",
    message: `The trip from ${route} assigned to ${driverName} has been cancelled.`,
  });

  const notificationByUserId = new Map(notifications.map((item) => [String(item.userId), item]));
  const pushRecipients = await getUsersWithPushPreference(recipients, "pushTrips");
  await Promise.allSettled(
    pushRecipients.map((user) => {
      const notification = notificationByUserId.get(String(user.id));
      if (!notification || !user.expoPushToken) return Promise.resolve();
      return NotificationService.sendExpoPush(user.expoPushToken, notification);
    })
  );
});

eventBus.subscribe(FLEET_EVENTS.DRIVER_ASSIGNED, async ({ payload }) => {
  const managerIds = await getManagerAndAdminIds();
  const recipients = [...new Set([payload.driverId, ...managerIds].filter(Boolean))];
  if (!recipients.length) return;

  const driver = await getUserById(payload.driverId);
  const driverName = userLabel(driver);
  const vehicleDisplayName = vehicleLabel(payload?.vehicle);

  const notifications = await Notification.bulkCreate(
    recipients.map((userId) => ({
      userId,
      type: NOTIFICATION_TYPES.DRIVER_ASSIGNED,
      title: "Driver Assigned",
      message: `${driverName} has been assigned to ${vehicleDisplayName}.`,
      entityId: payload?.tripId ?? payload?.vehicle?.id ?? null,
      entityType: payload?.tripId ? "trip" : "vehicle",
      metadata: {
        referenceId: payload?.tripId ?? payload?.vehicle?.id ?? null,
        referenceType: payload?.tripId ? "trip" : "vehicle",
        driverName,
        vehicleName: payload?.vehicle?.name ?? null,
        vehiclePlate: payload?.vehicle?.plaque_immatriculation ?? null,
      },
    }))
  );

  emitBulkSocketNotifications(notifications);

  const emailRecipients = await getUsersWithEmailPreference(recipients, "emailDrivers");
  await sendEmailToUsers(emailRecipients, {
    subject: "Driver Assignment Update",
    message: `${driverName} has been assigned to ${vehicleDisplayName}.`,
  });

  const notificationByUserId = new Map(notifications.map((item) => [String(item.userId), item]));
  const pushRecipients = await getUsersWithPushPreference(recipients, "pushDrivers");
  await Promise.allSettled(
    pushRecipients.map((user) => {
      const notification = notificationByUserId.get(String(user.id));
      if (!notification || !user.expoPushToken) return Promise.resolve();
      return NotificationService.sendExpoPush(user.expoPushToken, notification);
    })
  );
});

eventBus.on("maintenance:created", async ({ maintenance, vehicle }) => {
  const recipients = await getManagerAndAdminIds();
  if (!recipients.length) return;

  const vehicleDisplayName = maintenanceVehicleLabel(maintenance, vehicle);
  const scheduledDate = new Date(maintenance.scheduledDate).toLocaleDateString();

  const notifications = await Notification.bulkCreate(
    recipients.map((userId) => ({
      userId,
      type: NOTIFICATION_TYPES.MAINTENANCE_SCHEDULED,
      title: "Maintenance Scheduled",
      message: `${vehicleDisplayName} has maintenance scheduled for ${scheduledDate}.`,
      entityId: maintenance.id,
      entityType: "maintenance",
      metadata: {
        referenceId: maintenance.id,
        referenceType: "Maintenance",
        vehicleName: vehicle?.name ?? null,
        vehiclePlate: vehicle?.plaque_immatriculation ?? maintenance?.vehiclePlate ?? null,
      },
    }))
  );

  emitBulkSocketNotifications(notifications);

  const emailRecipients = await getUsersWithEmailPreference(recipients, "emailMaintenance");
  await sendEmailToUsers(emailRecipients, {
    subject: "Maintenance Scheduled",
    message: `${vehicleDisplayName} has maintenance scheduled for ${scheduledDate}.`,
  });

  const notificationByUserId = new Map(notifications.map((item) => [String(item.userId), item]));
  const pushRecipients = await getUsersWithPushPreference(recipients, "pushMaintenance");
  await Promise.allSettled(
    pushRecipients.map((user) => {
      const notification = notificationByUserId.get(String(user.id));
      if (!notification || !user.expoPushToken) return Promise.resolve();
      return NotificationService.sendExpoPush(user.expoPushToken, notification);
    })
  );
});

eventBus.on("maintenance:started", async ({ maintenance, vehicle }) => {
  const recipients = await getManagerAndAdminIds();
  if (!recipients.length) return;

  const vehicleDisplayName = maintenanceVehicleLabel(maintenance, vehicle);

  const notifications = await Notification.bulkCreate(
    recipients.map((userId) => ({
      userId,
      type: NOTIFICATION_TYPES.MAINTENANCE_STARTED,
      title: "Maintenance In Progress",
      message: `Maintenance has started on ${vehicleDisplayName}. The vehicle is temporarily unavailable.`,
      entityId: maintenance.id,
      entityType: "maintenance",
      metadata: {
        referenceId: maintenance.id,
        referenceType: "Maintenance",
        vehicleName: vehicle?.name ?? null,
        vehiclePlate: vehicle?.plaque_immatriculation ?? maintenance?.vehiclePlate ?? null,
      },
    }))
  );

  emitBulkSocketNotifications(notifications);

  const emailRecipients = await getUsersWithEmailPreference(recipients, "emailMaintenance");
  await sendEmailToUsers(emailRecipients, {
    subject: "Maintenance In Progress",
    message: `Maintenance has started on ${vehicleDisplayName}.`,
  });

  const notificationByUserId = new Map(notifications.map((item) => [String(item.userId), item]));
  const pushRecipients = await getUsersWithPushPreference(recipients, "pushMaintenance");
  await Promise.allSettled(
    pushRecipients.map((user) => {
      const notification = notificationByUserId.get(String(user.id));
      if (!notification || !user.expoPushToken) return Promise.resolve();
      return NotificationService.sendExpoPush(user.expoPushToken, notification);
    })
  );
});

eventBus.on("maintenance:completed", async ({ maintenance, vehicle }) => {
  const recipients = await getManagerAndAdminIds();
  if (!recipients.length) return;

  const vehicleDisplayName = maintenanceVehicleLabel(maintenance, vehicle);

  const notifications = await Notification.bulkCreate(
    recipients.map((userId) => ({
      userId,
      type: NOTIFICATION_TYPES.MAINTENANCE_COMPLETED,
      title: "Maintenance Completed",
      message: `${vehicleDisplayName} maintenance is complete and the vehicle is now available.`,
      entityId: maintenance.id,
      entityType: "maintenance",
      metadata: {
        referenceId: maintenance.id,
        referenceType: "Maintenance",
        vehicleName: vehicle?.name ?? null,
        vehiclePlate: vehicle?.plaque_immatriculation ?? maintenance?.vehiclePlate ?? null,
      },
    }))
  );

  emitBulkSocketNotifications(notifications);

  const emailRecipients = await getUsersWithEmailPreference(recipients, "emailMaintenance");
  await sendEmailToUsers(emailRecipients, {
    subject: "Maintenance Completed",
    message: `Maintenance for ${vehicleDisplayName} has been completed.`,
  });

  const notificationByUserId = new Map(notifications.map((item) => [String(item.userId), item]));
  const pushRecipients = await getUsersWithPushPreference(recipients, "pushMaintenance");
  await Promise.allSettled(
    pushRecipients.map((user) => {
      const notification = notificationByUserId.get(String(user.id));
      if (!notification || !user.expoPushToken) return Promise.resolve();
      return NotificationService.sendExpoPush(user.expoPushToken, notification);
    })
  );
});

eventBus.on("maintenance:cancelled", async ({ maintenance, vehicle }) => {
  const recipients = await getManagerAndAdminIds();
  if (!recipients.length) return;

  const vehicleDisplayName = maintenanceVehicleLabel(maintenance, vehicle);

  const notifications = await Notification.bulkCreate(
    recipients.map((userId) => ({
      userId,
      type: NOTIFICATION_TYPES.MAINTENANCE_CANCELLED,
      title: "Maintenance Cancelled",
      message: `Maintenance for ${vehicleDisplayName} has been cancelled.`,
      entityId: maintenance.id,
      entityType: "maintenance",
      metadata: {
        referenceId: maintenance.id,
        referenceType: "Maintenance",
        vehicleName: vehicle?.name ?? null,
        vehiclePlate: vehicle?.plaque_immatriculation ?? maintenance?.vehiclePlate ?? null,
      },
    }))
  );

  emitBulkSocketNotifications(notifications);

  const emailRecipients = await getUsersWithEmailPreference(recipients, "emailMaintenance");
  await sendEmailToUsers(emailRecipients, {
    subject: "Maintenance Cancelled",
    message: `Maintenance for ${vehicleDisplayName} has been cancelled.`,
  });

  const notificationByUserId = new Map(notifications.map((item) => [String(item.userId), item]));
  const pushRecipients = await getUsersWithPushPreference(recipients, "pushMaintenance");
  await Promise.allSettled(
    pushRecipients.map((user) => {
      const notification = notificationByUserId.get(String(user.id));
      if (!notification || !user.expoPushToken) return Promise.resolve();
      return NotificationService.sendExpoPush(user.expoPushToken, notification);
    })
  );
});

const getSystemNotificationRecipients = async (recipientIds = []) => {
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) return [];

  return User.findAll({
    where: {
      id: { [Op.in]: recipientIds },
      isActive: true,
    },
    attributes: ["id", "name", "email", "role", "expoPushToken", "pushAlerts", "pushSystem", "emailSystem"],
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

const buildTripActionUrl = (tripId) =>
  `/trips?status=ongoing&tripId=${encodeURIComponent(String(tripId))}`;

const dispatchRouteDeviationNotifications = async ({ payload }) => {
  if (!payload?.tripId) return;

  const trip = await Trip.findByPk(payload.tripId, {
    include: [
      { model: User, as: "driver", attributes: ["id", "name", "email"] },
      { model: Vehicle, as: "vehicle", attributes: ["id", "name", "plaque_immatriculation"] },
    ],
  });

  if (!trip) return;

  const existingRecentAlert = await Notification.findOne({
    where: {
      type: NOTIFICATION_TYPES.AI_ROUTE_DEVIATION,
      entityType: "trip",
      entityId: trip.id,
      isArchived: false,
      createdAt: {
        [Op.gte]: new Date(Date.now() - ROUTE_DEVIATION_ALERT_THROTTLE_MS),
      },
    },
    attributes: ["id"],
  });

  if (existingRecentAlert) return;

  const recipients = await getAlertRecipients();
  if (!recipients.length) return;

  const driverName = trip.driver?.name || payload.driverName || "The driver";
  const vehicleText = vehicleLabel(trip.vehicle, {
    name: payload.vehicleName,
    plate: payload.vehiclePlate,
  });
  const distanceText = formatDistance(payload.distanceMeters);
  const routeText = `${trip.startLocation || payload.startLocation || "start"} to ${
    trip.endLocation || payload.endLocation || "destination"
  }`;
  const recordedAtText = formatDateTime(payload.recordedAt);
  const title = "Route deviation detected";
  const message = `${driverName} is about ${distanceText} away from the planned route for ${vehicleText}.`;
  const emailMessage = `${message} Trip route: ${routeText}. Last phone location was recorded at ${recordedAtText}. Open the active trip details to review the driver's live position.`;
  const actionUrl = buildTripActionUrl(trip.id);

  const notifications = await Notification.bulkCreate(
    recipients.map((user) => ({
      userId: user.id,
      type: NOTIFICATION_TYPES.AI_ROUTE_DEVIATION,
      title,
      message,
      entityType: "trip",
      entityId: trip.id,
      actionUrl,
      group: "ai",
      priority: "high",
      metadata: {
        tripId: trip.id,
        driverId: trip.userId,
        driverName,
        vehicleId: trip.vehicleId,
        vehicleName: trip.vehicle?.name || payload.vehicleName || null,
        vehiclePlate: trip.vehicle?.plaque_immatriculation || payload.vehiclePlate || null,
        startLocation: trip.startLocation || payload.startLocation || null,
        endLocation: trip.endLocation || payload.endLocation || null,
        latitude: payload.latitude,
        longitude: payload.longitude,
        accuracy: payload.accuracy,
        speed: payload.speed,
        heading: payload.heading,
        recordedAt: payload.recordedAt,
        distanceMeters: payload.distanceMeters,
        thresholdMeters: payload.thresholdMeters,
      },
    }))
  );

  emitBulkSocketNotifications(notifications);

  await sendEmailToUsers(recipients.filter((user) => user.email && user.emailAI !== false), {
    subject: title,
    message: emailMessage,
  });

  const notificationByUserId = new Map(notifications.map((item) => [String(item.userId), item]));
  const pushRecipients = recipients.filter((user) => user.expoPushToken && user.pushAI !== false);

  await Promise.allSettled(
    pushRecipients.map((user) => {
      const notification = notificationByUserId.get(String(user.id));
      if (!notification || !user.expoPushToken) return Promise.resolve();
      return NotificationService.sendExpoPush(user.expoPushToken, notification);
    })
  );
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
  const emailRecipients = targetAdminsManagers.filter((user) => user.email && user.emailSystem !== false);

  await sendEmailToUsers(emailRecipients, {
    subject: payload?.title || "System notification",
    message: payload?.message || "A system update is available.",
  });

  const notificationByUserId = new Map(notifications.map((item) => [String(item.userId), item]));
  const pushRecipients = recipients.filter((user) => user.expoPushToken && user.pushSystem !== false);

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

eventBus.subscribe(FLEET_EVENTS.AI_ROUTE_DEVIATION, async ({ payload }) => {
  await dispatchRouteDeviationNotifications({ payload });
});

eventBus.subscribe(FLEET_EVENTS.SYSTEM_UPDATE, async ({ payload }) => {
  await dispatchSystemEventNotifications({
    payload,
    type: NOTIFICATION_TYPES.SYSTEM_UPDATE,
  });
});
