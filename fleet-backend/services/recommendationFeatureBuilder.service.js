const DRIVER_LICENSE_TYPES = ["B", "C", "D", "CE"];
const VEHICLE_FUEL_EFFICIENCY = ["low", "medium", "high"];
const VEHICLE_ENGINE_TYPES = ["diesel", "petrol", "hybrid", "electric"];
const VEHICLE_LOAD_TYPES = ["general", "cold", "fragile", "heavy"];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseFloat(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const normalizeCategoricalValue = (value, allowedValues, fallback) => {
  if (!value) return fallback;
  const normalized = String(value).trim().toLowerCase();
  const match = allowedValues.find((item) => item.toLowerCase() === normalized);
  return match ?? fallback;
};

export const calculateRegionMatch = (driver, trip) => {
  const tripRegion = String(trip?.region || "").trim().toLowerCase();
  if (!tripRegion) return 0;

  const preferredRegion = String(driver?.preferredRegion || "")
    .trim()
    .toLowerCase();
  if (preferredRegion && preferredRegion === tripRegion) return 1;

  const familiarRegions = Array.isArray(driver?.familiarRegions)
    ? driver.familiarRegions
    : [];
  return familiarRegions.some(
    (region) => String(region).trim().toLowerCase() === tripRegion
  )
    ? 1
    : 0;
};

export const calculateMaintenanceRisk = (vehicle, maintenances = []) => {
  if (!Array.isArray(maintenances) || maintenances.length === 0) return 0.1;
  const now = Date.now();
  let risk = 0.1;

  for (const maintenance of maintenances) {
    const status = String(maintenance?.status || "").toLowerCase();
    if (["pending", "scheduled", "in progress", "in_progress"].includes(status)) {
      risk += 0.4;
    }

    const scheduledDate = toDate(maintenance?.scheduledDate);
    if (scheduledDate) {
      const daysAgo = Math.max((now - scheduledDate.getTime()) / 86400000, 0);
      if (daysAgo <= 30) risk += 0.2;
      else if (daysAgo <= 90) risk += 0.1;
    }
  }

  if (String(vehicle?.status || "").toUpperCase() === "IN_MAINTENANCE") {
    risk += 0.5;
  }
  return clamp(Number(risk.toFixed(2)), 0, 1);
};

const estimateConditionFromAgeMileage = (age, mileage) => {
  const agePenalty = Math.min(age * 0.4, 4);
  const mileagePenalty = Math.min(mileage / 50000, 4);
  return clamp(Number((9 - agePenalty - mileagePenalty).toFixed(2)), 1, 10);
};

const estimateCapacityFromType = (vehicle) => {
  const type = String(vehicle?.vehicle_type || vehicle?.type || "")
    .trim()
    .toLowerCase();
  if (["truck", "bus"].includes(type)) return 1500;
  if (["van", "suv"].includes(type)) return 700;
  return 400;
};

export const estimateDriverDefaults = (driver = {}) => {
  const totalTrips = Math.max(
    toNumber(driver.totalTrips, toNumber(driver.completedTrips, 0)),
    0
  );
  const completedTrips = Math.max(toNumber(driver.completedTrips, 0), 0);
  const failedTrips = Math.max(
    toNumber(driver.failedTrips, Math.max(totalTrips - completedTrips, 0)),
    0
  );
  const successRateBase =
    totalTrips > 0 ? completedTrips / Math.max(totalTrips, 1) : 0.75;

  return {
    experienceYears: Math.max(
      toNumber(driver.experienceYears, toNumber(driver.yearsOfExperience, 1)),
      0
    ),
    rating: clamp(toNumber(driver.driverRating, toNumber(driver.rating, 3.5)), 0, 5),
    completedTrips: Math.round(completedTrips),
    failedTrips: Math.round(failedTrips),
    successRate: clamp(toNumber(driver.successRate, successRateBase), 0, 1),
    licenseType: normalizeCategoricalValue(
      driver.licenseType,
      DRIVER_LICENSE_TYPES,
      "B"
    ),
    medicalCheckValid: toDate(driver.medicalCheckExpiryDate)
      ? Number(toDate(driver.medicalCheckExpiryDate) >= new Date())
      : 1,
    preferredRegion: driver.preferredRegion || null,
    isAvailable:
      typeof driver.isAvailable === "boolean" ? driver.isAvailable : true,
  };
};

export const estimateVehicleDefaults = (vehicle = {}) => {
  const age = Math.max(
    toNumber(
      vehicle.age,
      toNumber(vehicle.Vehicle_Age, new Date().getFullYear() - toNumber(vehicle.year, new Date().getFullYear() - 5))
    ),
    0
  );
  const mileage = Math.max(toNumber(vehicle.mileage, 50000), 0);
  const condition = clamp(
    toNumber(vehicle.conditionRating, estimateConditionFromAgeMileage(age, mileage)),
    1,
    10
  );

  return {
    mileage,
    age,
    conditionRating: condition,
    capacity: Math.max(toNumber(vehicle.capacity, estimateCapacityFromType(vehicle)), 0),
    fuelEfficiency: normalizeCategoricalValue(
      vehicle.fuelEfficiencyCategory || vehicle.fuelEfficiency,
      VEHICLE_FUEL_EFFICIENCY,
      "medium"
    ),
    engineType: normalizeCategoricalValue(
      vehicle.engineType || vehicle.fuel_type,
      VEHICLE_ENGINE_TYPES,
      "diesel"
    ),
    loadType: normalizeCategoricalValue(
      vehicle.loadType,
      VEHICLE_LOAD_TYPES,
      "general"
    ),
    isAvailable:
      typeof vehicle.isAvailable === "boolean"
        ? vehicle.isAvailable
        : vehicle.is_active !== false,
  };
};

export const normalizeDriver = (driver = {}) => {
  const defaults = estimateDriverDefaults(driver);
  return {
    id: driver.id,
    name: driver.name || "Unknown Driver",
    ...defaults,
    familiarRegions: Array.isArray(driver.familiarRegions) ? driver.familiarRegions : [],
    licenseExpiryDate: driver.licenseExpiryDate || driver.licenseExpiry || null,
    medicalCheckExpiryDate: driver.medicalCheckExpiryDate || null,
    status: String(driver.status || "active").toLowerCase(),
    role: driver.role,
    isActive: Boolean(driver.isActive),
  };
};

export const normalizeVehicle = (vehicle = {}) => {
  const defaults = estimateVehicleDefaults(vehicle);
  return {
    id: vehicle.id,
    name: vehicle.name || vehicle.plaque_immatriculation || "Unknown Vehicle",
    ...defaults,
    status: String(vehicle.status || "AVAILABLE").toUpperCase(),
    lastMaintenanceDate: vehicle.lastMaintenanceDate || vehicle.last_service_date || null,
    nextMaintenanceDate: vehicle.nextMaintenanceDate || null,
  };
};

export const buildDriverFeatures = (driver, trip) => {
  const normalizedDriver = normalizeDriver(driver);
  const regionMatch = calculateRegionMatch(normalizedDriver, trip);
  return {
    id: normalizedDriver.id,
    experienceYears: normalizedDriver.experienceYears,
    rating: normalizedDriver.rating,
    completedTrips: normalizedDriver.completedTrips,
    successRate: normalizedDriver.successRate,
    regionMatch,
    medicalCheckValid: normalizedDriver.medicalCheckValid,
    licenseType: normalizedDriver.licenseType,
    tripDistance: Math.max(toNumber(trip?.distance, 0), 0),
  };
};

export const buildVehicleFeatures = (vehicle, trip, maintenances = []) => {
  const normalizedVehicle = normalizeVehicle(vehicle);
  const tripLoadType = normalizeCategoricalValue(
    trip?.loadType,
    VEHICLE_LOAD_TYPES,
    normalizedVehicle.loadType
  );
  return {
    id: normalizedVehicle.id,
    mileage: normalizedVehicle.mileage,
    age: normalizedVehicle.age,
    conditionRating: normalizedVehicle.conditionRating,
    capacity: normalizedVehicle.capacity,
    fuelEfficiency: normalizedVehicle.fuelEfficiency,
    engineType: normalizedVehicle.engineType,
    loadType: tripLoadType,
    tripDistance: Math.max(toNumber(trip?.distance, 0), 0),
    requiredCapacity: Math.max(toNumber(trip?.requiredCapacity, 0), 0),
    maintenanceRisk: calculateMaintenanceRisk(normalizedVehicle, maintenances),
  };
};

