import User from "./user.model.js";
import Vehicle from "./vehicle.model.js";
import Reclamation from "./reclamation.model.js";

// Relations
Reclamation.belongsTo(User, { foreignKey: "userId", as: "user" });
Reclamation.belongsTo(Vehicle, { foreignKey: "vehicleId", as: "vehicle" });

User.hasMany(Reclamation, { foreignKey: "userId", as: "reclamations" });
Vehicle.hasMany(Reclamation, { foreignKey: "vehicleId", as: "reclamations" });
