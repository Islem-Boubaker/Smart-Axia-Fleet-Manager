import EventEmitter from "events";

export const FLEET_EVENTS = {
  TRIP_ASSIGNED: "fleet:trip:assigned",
  TRIP_STARTED: "fleet:trip:started",
  TRIP_COMPLETED: "fleet:trip:completed",
  TRIP_CANCELLED: "fleet:trip:cancelled",
  TRIP_DELAYED: "fleet:trip:delayed",
  MAINTENANCE_OVERDUE: "fleet:maintenance:overdue",
  MAINTENANCE_SCHEDULED: "fleet:maintenance:scheduled",
  MAINTENANCE_COMPLETED: "fleet:maintenance:completed",
  VEHICLE_BREAKDOWN: "fleet:vehicle:breakdown",
  VEHICLE_IDLE: "fleet:vehicle:idle",
  AI_ANOMALY_DETECTED: "fleet:ai:anomaly_detected",
  AI_FUEL_ANOMALY: "fleet:ai:fuel_anomaly",
  AI_ROUTE_DEVIATION: "fleet:ai:route_deviation",
  AI_SPEED_VIOLATION: "fleet:ai:speed_violation",
  AI_PREDICTIVE_ALERT: "fleet:ai:predictive_alert",
  DRIVER_ASSIGNED: "fleet:driver:assigned",
  DRIVER_UNASSIGNED: "fleet:driver:unassigned",
  DRIVER_LICENSE_EXPIRY: "fleet:driver:license_expiry",
  DRIVER_BEHAVIOR_ALERT: "fleet:driver:behavior_alert",
  SYSTEM_ALERT: "fleet:system:alert",
  SYSTEM_UPDATE: "fleet:system:update",
};

class FleetEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
    this.setupErrorHandler();
  }

  emitEvent(event, payload) {
    const envelope = {
      event,
      payload,
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV !== "production") {
      console.log(`[EventBus] ${event}`, JSON.stringify(payload));
    }

    this.emit(event, envelope);
  }

  subscribe(event, handler) {
    const safeHandler = async (envelope) => {
      try {
        await handler(envelope);
      } catch (error) {
        console.error(`[EventBus] Handler error for ${event}:`, error.message);
        this.emit("fleet:error", {
          event,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    };

    this.on(event, safeHandler);
    return () => this.off(event, safeHandler);
  }

  setupErrorHandler() {
    this.on("error", (error) => {
      console.error("[EventBus] Unhandled error event:", error);
    });
  }
}

export const eventBus = new FleetEventBus();
