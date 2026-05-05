import User from "./user.model.js";
import Vehicle from "./vehicle.model.js";
import Reclamation from "./reclamation.model.js";
import Maintenance from "./maintenance.model.js";
import Trip from "./trip.model.js";
import TripStop from "./TripStop.js";
import TripLocationPing from "./tripLocationPing.model.js";
import Notification from "./notification.model.js";
import DriverScoreEvent from "./driverScoreEvent.model.js";

Trip.hasMany(TripStop, { foreignKey: "tripId", as: "stops", onDelete: "CASCADE" });
TripStop.belongsTo(Trip, { foreignKey: "tripId", as: "trip" });
Trip.hasMany(TripLocationPing, { foreignKey: "tripId", as: "locationPings", onDelete: "CASCADE" });
TripLocationPing.belongsTo(Trip, { foreignKey: "tripId", as: "trip" });
TripLocationPing.belongsTo(User, { foreignKey: "userId", as: "driver" });
Trip.belongsTo(User, { foreignKey: "userId", as: "driver" });
Trip.belongsTo(Vehicle, { foreignKey: "vehicleId", as: "vehicle" });
Maintenance.belongsTo(Vehicle, { foreignKey: "vehicleId", as: "vehicle", onDelete: "RESTRICT" });
Vehicle.hasMany(Maintenance, { foreignKey: "vehicleId", as: "maintenances" });
Maintenance.belongsTo(Reclamation, { foreignKey: "reclamationId", as: "reclamation", onDelete: "SET NULL" });
Reclamation.hasMany(Maintenance, { foreignKey: "reclamationId", as: "maintenances" });
Maintenance.belongsTo(User, { foreignKey: "createdBy", as: "creator", onDelete: "SET NULL" });
Maintenance.belongsTo(User, { foreignKey: "updatedBy", as: "updater", onDelete: "SET NULL" });
Reclamation.belongsTo(User, { foreignKey: "userId", as: "driver" });
Reclamation.belongsTo(Vehicle, { foreignKey: "vehicleId", as: "vehicle" });
User.hasMany(DriverScoreEvent, { foreignKey: "driverId", as: "scoreEvents", onDelete: "CASCADE" });
DriverScoreEvent.belongsTo(User, { foreignKey: "driverId", as: "driver" });
Trip.hasMany(DriverScoreEvent, { foreignKey: "tripId", as: "scoreEvents", onDelete: "SET NULL" });
DriverScoreEvent.belongsTo(Trip, { foreignKey: "tripId", as: "trip" });
Reclamation.hasMany(DriverScoreEvent, { foreignKey: "reclamationId", as: "scoreEvents", onDelete: "SET NULL" });
DriverScoreEvent.belongsTo(Reclamation, { foreignKey: "reclamationId", as: "reclamation" });

if (typeof Notification.associate === "function") {
	Notification.associate({ User });
}

export { User, Vehicle, Reclamation, Maintenance, Trip, TripStop, TripLocationPing, Notification, DriverScoreEvent };
