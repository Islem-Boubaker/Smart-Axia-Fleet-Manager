import eventBus from "./eventBus.js";
import * as notificationService from "../services/notification.service.js";

eventBus.on("trip.assigned", async ({ trip }) => {
    await notificationService.createNotificationService({
        userId: trip.userId,
        type: "trip",
        priority: "high",
        title: "New trip assigned",
        message: `Trip from ${trip.startLocation} to ${trip.endLocation}`,
        entityType: "trip",
        entityId: trip.id,
        actionUrl: `/trips/${trip.id}`,
        metadata: { 
            startTime: trip.startTime,
            vehicleId: trip.vehicleId,
        },
    });
});

eventBus.on("trip.cancelled", async ({ trip }) => {
    await notificationService.createNotificationService({
        userId: trip.userId,
        type: "trip",
        priority: "high",
        title: "Trip cancelled",
        message: `Your trip from ${trip.startLocation} to ${trip.endLocation} was cancelled`,
        entityType: "trip",
        entityId: trip.id,
        actionUrl: `/trips/${trip.id}`,
    });
});

eventBus.on("vehicle.out_of_service", async ({ vehicle, managerIds }) => {
    await Promise.all(
        managerIds.map((userId) =>
            notificationService.createNotificationService({
                userId,
                type: "vehicle",
                priority: "high",
                title: "Vehicle out of service",
                message: `Vehicle ${vehicle.registrationNumber} is out of service`,
                entityType: "vehicle",
                entityId: vehicle.id,
                actionUrl: `/vehicles/${vehicle.id}`,
            })
        )
    );
});
