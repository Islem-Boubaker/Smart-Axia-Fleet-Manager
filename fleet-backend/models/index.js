import User from "./user.model.js";
import Vehicle from "./vehicle.model.js";
import Reclamation from "./reclamation.model.js";
import Maintenance from "./Maintenance.model.js";
import Trip from "./trip.model.js";
import TripStop from "./TripStop.js";
import Notification from "./notification.model.js";

Trip.hasMany(TripStop, { foreignKey: "tripId", as: "stops", onDelete: "CASCADE" });
TripStop.belongsTo(Trip, { foreignKey: "tripId", as: "trip" });
Trip.belongsTo(User, { foreignKey: "userId", as: "driver" });
Trip.belongsTo(Vehicle, { foreignKey: "vehicleId", as: "vehicle" });
Maintenance.belongsTo(Vehicle, { foreignKey: "vehicleId", as: "vehicle", onDelete: "RESTRICT" });
Vehicle.hasMany(Maintenance, { foreignKey: "vehicleId", as: "maintenances" });
Maintenance.belongsTo(User, { foreignKey: "createdBy", as: "creator", onDelete: "SET NULL" });
Maintenance.belongsTo(User, { foreignKey: "updatedBy", as: "updater", onDelete: "SET NULL" });

if (typeof Notification.associate === "function") {
	Notification.associate({ User });
}

export { User, Vehicle, Reclamation, Maintenance, Trip, TripStop, Notification };