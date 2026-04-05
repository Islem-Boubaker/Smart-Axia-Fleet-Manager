import { eventBus, FLEET_EVENTS } from "./eventBus.js";
import { NOTIFICATION_TYPES } from "../constants/notification.constants.js";
import NotificationService from "../services/notification.service.js";

async function notify(userId, type, title, message, extra = {}) {
  if (!userId) return null;

  return NotificationService.createNotification({
    userId,
    type,
    title,
    message,
    metadata: extra.metadata ?? {},
    entityType: extra.entityType ?? null,
    entityId: extra.entityId ?? null,
    actionUrl: extra.actionUrl ?? null,
    expiresAt: extra.expiresAt ?? null,
    sendPush: extra.sendPush ?? true,
  });
}

async function notifyMany(userIds, type, title, message, extra = {}) {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];

  return NotificationService.createBulkNotifications(userIds, {
    type,
    title,
    message,
    metadata: extra.metadata ?? {},
    entityType: extra.entityType ?? null,
    entityId: extra.entityId ?? null,
    actionUrl: extra.actionUrl ?? null,
    expiresAt: extra.expiresAt ?? null,
    sendPush: extra.sendPush ?? true,
  });
}

eventBus.subscribe(FLEET_EVENTS.TRIP_ASSIGNED, async ({ payload }) => {
  const { trip, driverId, managerId, vehicleId } = payload;

  await notify(
    driverId,
    NOTIFICATION_TYPES.TRIP_ASSIGNED,
    "New Trip Assigned",
    `You have been assigned trip #${trip.reference ?? trip.id}.`,
    {
      entityType: "trip",
      entityId: trip.id,
      metadata: { tripId: trip.id, vehicleId },
    }
  );

  if (managerId) {
    await notify(
      managerId,
      NOTIFICATION_TYPES.TRIP_ASSIGNED,
      "Trip Assigned",
      `Trip #${trip.reference ?? trip.id} has been assigned to a driver.`,
      {
        entityType: "trip",
        entityId: trip.id,
        metadata: { tripId: trip.id, driverId },
      }
    );
  }
});

eventBus.subscribe(FLEET_EVENTS.TRIP_STARTED, async ({ payload }) => {
  const { trip, driverId, managerId } = payload;

  await notifyMany(
    [managerId].filter(Boolean),
    NOTIFICATION_TYPES.TRIP_STARTED,
    "Trip Started",
    `Trip #${trip.reference ?? trip.id} is now underway.`,
    {
      entityType: "trip",
      entityId: trip.id,
      metadata: { tripId: trip.id, driverId, startedAt: trip.startedAt ?? trip.started_at },
    }
  );
});

eventBus.subscribe(FLEET_EVENTS.TRIP_COMPLETED, async ({ payload }) => {
  const { trip, driverId, managerId } = payload;

  await notifyMany(
    [driverId, managerId].filter(Boolean),
    NOTIFICATION_TYPES.TRIP_COMPLETED,
    "Trip Completed",
    `Trip #${trip.reference ?? trip.id} has been completed successfully.`,
    {
      entityType: "trip",
      entityId: trip.id,
      metadata: { tripId: trip.id, duration: trip.durationMinutes ?? trip.duration_minutes },
    }
  );
});

eventBus.subscribe(FLEET_EVENTS.TRIP_CANCELLED, async ({ payload }) => {
  const { trip, driverId, managerId, reason } = payload;

  await notifyMany(
    [driverId, managerId].filter(Boolean),
    NOTIFICATION_TYPES.TRIP_CANCELLED,
    "Trip Cancelled",
    `Trip #${trip.reference ?? trip.id} has been cancelled.${reason ? ` Reason: ${reason}` : ""}`,
    {
      entityType: "trip",
      entityId: trip.id,
      metadata: { tripId: trip.id, reason },
    }
  );
});

eventBus.subscribe(FLEET_EVENTS.TRIP_DELAYED, async ({ payload }) => {
  const { trip, driverId, managerId, delayMinutes } = payload;

  await notifyMany(
    [driverId, managerId].filter(Boolean),
    NOTIFICATION_TYPES.TRIP_DELAYED,
    "Trip Delayed",
    `Trip #${trip.reference ?? trip.id} is delayed by ${delayMinutes} minutes.`,
    {
      entityType: "trip",
      entityId: trip.id,
      metadata: { tripId: trip.id, delayMinutes },
    }
  );
});

eventBus.subscribe(FLEET_EVENTS.MAINTENANCE_OVERDUE, async ({ payload }) => {
  const { vehicle, managerId, overdueBy, maintenanceId } = payload;

  await notify(
    managerId,
    NOTIFICATION_TYPES.MAINTENANCE_OVERDUE,
    "Maintenance Overdue",
    `Vehicle ${vehicle.plate ?? vehicle.id} maintenance is overdue by ${overdueBy} days.`,
    {
      entityType: "vehicle",
      entityId: vehicle.id,
      metadata: { vehicleId: vehicle.id, maintenanceId, overdueBy },
    }
  );
});

eventBus.subscribe(FLEET_EVENTS.MAINTENANCE_SCHEDULED, async ({ payload }) => {
  const { vehicle, managerId, scheduledAt, maintenanceId } = payload;

  await notify(
    managerId,
    NOTIFICATION_TYPES.MAINTENANCE_SCHEDULED,
    "Maintenance Scheduled",
    `Maintenance for vehicle ${vehicle.plate ?? vehicle.id} is scheduled for ${new Date(scheduledAt).toLocaleDateString()}.`,
    {
      entityType: "vehicle",
      entityId: vehicle.id,
      metadata: { vehicleId: vehicle.id, maintenanceId, scheduledAt },
    }
  );
});

eventBus.subscribe(FLEET_EVENTS.MAINTENANCE_COMPLETED, async ({ payload }) => {
  const { vehicle, managerId, maintenanceId } = payload;

  await notify(
    managerId,
    NOTIFICATION_TYPES.MAINTENANCE_COMPLETED,
    "Maintenance Completed",
    `Vehicle ${vehicle.plate ?? vehicle.id} maintenance has been completed.`,
    {
      entityType: "vehicle",
      entityId: vehicle.id,
      metadata: { vehicleId: vehicle.id, maintenanceId },
    }
  );
});

eventBus.subscribe(FLEET_EVENTS.VEHICLE_BREAKDOWN, async ({ payload }) => {
  const { vehicle, driverId, managerId, location } = payload;

  await notifyMany(
    [driverId, managerId].filter(Boolean),
    NOTIFICATION_TYPES.VEHICLE_BREAKDOWN,
    "Vehicle Breakdown",
    `Vehicle ${vehicle.plate ?? vehicle.id} has reported a breakdown.`,
    {
      entityType: "vehicle",
      entityId: vehicle.id,
      metadata: { vehicleId: vehicle.id, driverId, location },
    }
  );
});

eventBus.subscribe(FLEET_EVENTS.VEHICLE_IDLE, async ({ payload }) => {
  const { vehicle, managerId, durationMinutes } = payload;

  await notify(
    managerId,
    NOTIFICATION_TYPES.VEHICLE_IDLE,
    "Vehicle Idle",
    `Vehicle ${vehicle.plate ?? vehicle.id} has been idle for ${durationMinutes} minutes.`,
    {
      entityType: "vehicle",
      entityId: vehicle.id,
      metadata: { vehicleId: vehicle.id, durationMinutes },
    }
  );
});

eventBus.subscribe(FLEET_EVENTS.AI_ANOMALY_DETECTED, async ({ payload }) => {
  const { managerId, vehicle, anomalyType, anomalyScore, description } = payload;

  await notify(
    managerId,
    NOTIFICATION_TYPES.AI_ANOMALY_DETECTED,
    "AI Anomaly Detected",
    `Anomaly detected on vehicle ${vehicle?.plate ?? vehicle?.id ?? "unknown"}: ${description ?? anomalyType}`,
    {
      entityType: "vehicle",
      entityId: vehicle?.id,
      metadata: { vehicleId: vehicle?.id, anomalyType, anomalyScore, description },
    }
  );
});

eventBus.subscribe(FLEET_EVENTS.AI_FUEL_ANOMALY, async ({ payload }) => {
  const { managerId, vehicle, expectedLiters, actualLiters, tripId } = payload;

  await notify(
    managerId,
    NOTIFICATION_TYPES.AI_FUEL_ANOMALY,
    "Fuel Anomaly Detected",
    `Abnormal fuel consumption on vehicle ${vehicle?.plate ?? vehicle?.id}. Expected: ${expectedLiters}L, Actual: ${actualLiters}L`,
    {
      entityType: "vehicle",
      entityId: vehicle?.id,
      metadata: { vehicleId: vehicle?.id, tripId, expectedLiters, actualLiters },
    }
  );
});

eventBus.subscribe(FLEET_EVENTS.AI_ROUTE_DEVIATION, async ({ payload }) => {
  const { managerId, driverId, vehicle, tripId, deviationKm } = payload;

  await notifyMany(
    [managerId, driverId].filter(Boolean),
    NOTIFICATION_TYPES.AI_ROUTE_DEVIATION,
    "Route Deviation Detected",
    `Vehicle ${vehicle?.plate ?? vehicle?.id} has deviated ${deviationKm} km from the planned route.`,
    {
      entityType: "trip",
      entityId: tripId,
      metadata: { vehicleId: vehicle?.id, tripId, deviationKm },
    }
  );
});

eventBus.subscribe(FLEET_EVENTS.AI_SPEED_VIOLATION, async ({ payload }) => {
  const { managerId, driverId, vehicle, speedKmh, limitKmh, location } = payload;

  await notifyMany(
    [managerId, driverId].filter(Boolean),
    NOTIFICATION_TYPES.AI_SPEED_VIOLATION,
    "Speed Violation",
    `Vehicle ${vehicle?.plate ?? vehicle?.id} exceeded speed limit: ${speedKmh} km/h (limit: ${limitKmh} km/h).`,
    {
      entityType: "vehicle",
      entityId: vehicle?.id,
      metadata: { vehicleId: vehicle?.id, driverId, speedKmh, limitKmh, location },
    }
  );
});

eventBus.subscribe(FLEET_EVENTS.AI_PREDICTIVE_ALERT, async ({ payload }) => {
  const { managerId, vehicle, alertType, message, confidence } = payload;

  await notify(
    managerId,
    NOTIFICATION_TYPES.AI_PREDICTIVE_ALERT,
    "Predictive Alert",
    message ?? `Predictive maintenance alert for vehicle ${vehicle?.plate ?? vehicle?.id}.`,
    {
      entityType: "vehicle",
      entityId: vehicle?.id,
      metadata: { vehicleId: vehicle?.id, alertType, confidence },
    }
  );
});

eventBus.subscribe(FLEET_EVENTS.DRIVER_ASSIGNED, async ({ payload }) => {
  const { driverId, vehicle, tripId } = payload;

  await notify(
    driverId,
    NOTIFICATION_TYPES.DRIVER_ASSIGNED,
    "Vehicle Assigned",
    `You have been assigned vehicle ${vehicle?.plate ?? vehicle?.id}.`,
    {
      entityType: "vehicle",
      entityId: vehicle?.id,
      metadata: { vehicleId: vehicle?.id, tripId },
    }
  );
});

eventBus.subscribe(FLEET_EVENTS.DRIVER_UNASSIGNED, async ({ payload }) => {
  const { driverId, vehicle, tripId } = payload;

  await notify(
    driverId,
    NOTIFICATION_TYPES.SYSTEM_UPDATE,
    "Vehicle Unassigned",
    `You have been unassigned from vehicle ${vehicle?.plate ?? vehicle?.id}.`,
    {
      entityType: "vehicle",
      entityId: vehicle?.id,
      metadata: { vehicleId: vehicle?.id, tripId },
    }
  );
});

eventBus.subscribe(FLEET_EVENTS.DRIVER_LICENSE_EXPIRY, async ({ payload }) => {
  const { driverId, managerId, expiryDate, daysUntilExpiry } = payload;

  await notifyMany(
    [driverId, managerId].filter(Boolean),
    NOTIFICATION_TYPES.DRIVER_LICENSE_EXPIRY,
    "License Expiring Soon",
    `Driver license expires in ${daysUntilExpiry} days (${new Date(expiryDate).toLocaleDateString()}).`,
    {
      entityType: "driver",
      entityId: driverId,
      metadata: { driverId, expiryDate, daysUntilExpiry },
    }
  );
});

eventBus.subscribe(FLEET_EVENTS.DRIVER_BEHAVIOR_ALERT, async ({ payload }) => {
  const { driverId, managerId, behaviorType, description, tripId } = payload;

  await notifyMany(
    [driverId, managerId].filter(Boolean),
    NOTIFICATION_TYPES.DRIVER_BEHAVIOR_ALERT,
    "Driver Behavior Alert",
    description ?? `Unsafe driving behavior detected: ${behaviorType}`,
    {
      entityType: "driver",
      entityId: driverId,
      metadata: { driverId, behaviorType, tripId },
    }
  );
});

eventBus.subscribe(FLEET_EVENTS.SYSTEM_ALERT, async ({ payload }) => {
  const { recipientIds, title, message, metadata } = payload;

  await notifyMany(
    recipientIds ?? [],
    NOTIFICATION_TYPES.SYSTEM_ALERT,
    title ?? "System Alert",
    message,
    { metadata: metadata ?? {} }
  );
});

eventBus.subscribe(FLEET_EVENTS.SYSTEM_UPDATE, async ({ payload }) => {
  const { recipientIds, title, message, metadata } = payload;

  await notifyMany(
    recipientIds ?? [],
    NOTIFICATION_TYPES.SYSTEM_UPDATE,
    title ?? "System Update",
    message,
    { metadata: metadata ?? {} }
  );
});
