import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_TIMEOUT_MS = Number(process.env.ML_TIMEOUT_MS || 10000);
const PYTHON_BIN = process.env.ML_PYTHON_BIN || "python";
const DRIVER_SCRIPT =
  process.env.ML_DRIVER_SCRIPT ||
  path.resolve(__dirname, "../../fleet-recommendation-services/predict_driver.py");
const VEHICLE_SCRIPT =
  process.env.ML_VEHICLE_SCRIPT ||
  path.resolve(__dirname, "../../fleet-recommendation-services/predict_vehicle.py");

const clampScore = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(Math.max(num, 0), 100);
};

const runPythonPrediction = (scriptPath, payload, timeoutMs = DEFAULT_TIMEOUT_MS) =>
  new Promise((resolve, reject) => {
    const processRef = spawn(PYTHON_BIN, [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      processRef.kill("SIGKILL");
    }, timeoutMs);

    processRef.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    processRef.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    processRef.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    processRef.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`ML process timed out after ${timeoutMs}ms`));
        return;
      }
      if (code !== 0) {
        reject(new Error(stderr || `ML process exited with code ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout || "{}"));
      } catch {
        reject(new Error(`Invalid ML JSON response: ${stdout}`));
      }
    });

    processRef.stdin.write(JSON.stringify(payload));
    processRef.stdin.end();
  });

const fallbackDriverScore = (feature) => {
  const completedFactor = Math.min((Number(feature.completedTrips) || 0) / 50, 1) * 10;
  const raw =
    (Number(feature.rating) || 0) * 15 +
    (Number(feature.experienceYears) || 0) * 3 +
    (Number(feature.successRate) || 0) * 20 +
    (Number(feature.regionMatch) || 0) * 10 +
    completedFactor;
  return clampScore(raw);
};

const fallbackVehicleScore = (feature) => {
  const requiredCapacity = Number(feature.requiredCapacity) || 0;
  const capacity = Number(feature.capacity) || 0;
  const mileage = Number(feature.mileage) || 0;
  const maintenanceRisk = Number(feature.maintenanceRisk) || 0;
  const age = Number(feature.age) || 0;
  const conditionRating = Number(feature.conditionRating) || 0;
  const capacityRatio = requiredCapacity > 0 ? Math.min(capacity / requiredCapacity, 1.5) : 1;
  const fuelScoreMap = { low: 8, medium: 12, high: 16 };
  const fuelScore = fuelScoreMap[String(feature.fuelEfficiency || "medium")] || 12;
  const raw =
    conditionRating * 10 +
    capacityRatio * 20 +
    fuelScore -
    mileage / 15000 -
    maintenanceRisk * 30 -
    age * 1.5;
  return clampScore(raw);
};

const normalizePredictionArray = (items = [], idKey) =>
  items.map((item) => ({
    id: item.id || item[idKey],
    score: clampScore(item.score ?? item.predicted_score ?? 0),
  }));

export const predictManyDrivers = async (driverFeatureList) => {
  const payload = { drivers: driverFeatureList };
  try {
    const response = await runPythonPrediction(DRIVER_SCRIPT, payload);
    if (!response?.success || !Array.isArray(response.predictions)) {
      throw new Error("Invalid ML driver response format");
    }
    return {
      source: "ml",
      predictions: normalizePredictionArray(response.predictions, "driver_id"),
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error.message,
      predictions: driverFeatureList.map((item) => ({
        id: item.id,
        score: fallbackDriverScore(item),
      })),
    };
  }
};

export const predictManyVehicles = async (vehicleFeatureList) => {
  const payload = { vehicles: vehicleFeatureList };
  try {
    const response = await runPythonPrediction(VEHICLE_SCRIPT, payload);
    if (!response?.success || !Array.isArray(response.predictions)) {
      throw new Error("Invalid ML vehicle response format");
    }
    return {
      source: "ml",
      predictions: normalizePredictionArray(response.predictions, "vehicle_id"),
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error.message,
      predictions: vehicleFeatureList.map((item) => ({
        id: item.id,
        score: fallbackVehicleScore(item),
      })),
    };
  }
};

export const predictDriverScore = async (features) => {
  const { predictions, source } = await predictManyDrivers([features]);
  return { source, score: predictions[0]?.score ?? fallbackDriverScore(features) };
};

export const predictVehicleScore = async (features) => {
  const { predictions, source } = await predictManyVehicles([features]);
  return { source, score: predictions[0]?.score ?? fallbackVehicleScore(features) };
};

export { clampScore, fallbackDriverScore, fallbackVehicleScore };

