import User from "./user.model.js";
import Vehicle from "./vehicle.model.js";
import Reclamation from "./reclamation.model.js";
import Maintenance from "./maintenance.model.js";
import Trip from "./trip.model.js";
import Notification from "./notification.model.js";

Reclamation.belongsTo(User, { foreignKey: "userId", as: "user" });
Reclamation.belongsTo(Vehicle, { foreignKey: "vehicleId", as: "vehicle" });

User.hasMany(Reclamation, { foreignKey: "userId", as: "reclamations" });
Vehicle.hasMany(Reclamation, { foreignKey: "vehicleId", as: "reclamations" });


Maintenance.belongsTo(Vehicle, { foreignKey: "vehicleId", as: "vehicle" });

Vehicle.hasMany(Maintenance, { foreignKey: "vehicleId", as: "maintenances" });




// Trip → User
Trip.belongsTo(User, { foreignKey: "userId", as: "driver" });
User.hasMany(Trip, { foreignKey: "userId", as: "trips" });

// Trip → Vehicle
Trip.belongsTo(Vehicle, { foreignKey: "vehicleId", as: "vehicle" });
Vehicle.hasMany(Trip, { foreignKey: "vehicleId", as: "trips" });




Notification.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });