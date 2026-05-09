import json
import os
import sys
import joblib
import pandas as pd

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "vehicle_pipeline.pkl")
FEATURE_ORDER = [
    "mileage",
    "age",
    "conditionRating",
    "capacity",
    "fuelEfficiency",
    "engineType",
    "loadType",
    "tripDistance",
    "requiredCapacity",
    "maintenanceRisk",
]


def clamp_score(value):
    return float(max(0, min(100, value)))


def normalize_vehicle(item):
    fuel = str(item.get("fuelEfficiency", "medium") or "medium").lower()
    if fuel not in {"low", "medium", "high"}:
        fuel = "medium"
    engine = str(item.get("engineType", "diesel") or "diesel").lower()
    if engine not in {"diesel", "petrol", "hybrid", "electric"}:
        engine = "diesel"
    load_type = str(item.get("loadType", "general") or "general").lower()
    if load_type not in {"general", "cold", "fragile", "heavy"}:
        load_type = "general"

    return {
        "id": item.get("id"),
        "mileage": max(float(item.get("mileage", 50000) or 50000), 0),
        "age": max(float(item.get("age", 5) or 5), 0),
        "conditionRating": max(1.0, min(10.0, float(item.get("conditionRating", 6) or 6))),
        "capacity": max(float(item.get("capacity", 0) or 0), 0),
        "fuelEfficiency": fuel,
        "engineType": engine,
        "loadType": load_type,
        "tripDistance": max(float(item.get("tripDistance", 0) or 0), 0),
        "requiredCapacity": max(float(item.get("requiredCapacity", 0) or 0), 0),
        "maintenanceRisk": max(0.0, min(1.0, float(item.get("maintenanceRisk", 0.1) or 0.1))),
    }


def main():
    try:
        payload = json.loads(sys.stdin.read() or "{}")
        vehicles = payload.get("vehicles")
        if not isinstance(vehicles, list):
            single = payload.get("vehicle")
            vehicles = [single] if isinstance(single, dict) else []
        if not vehicles:
            raise ValueError("No vehicles provided")

        pipeline = joblib.load(MODEL_PATH)
        normalized = [normalize_vehicle(item) for item in vehicles]
        frame = pd.DataFrame(normalized)[FEATURE_ORDER]
        predictions = pipeline.predict(frame)

        response = {
            "success": True,
            "predictions": [
                {"vehicle_id": item["id"], "score": clamp_score(score)}
                for item, score in zip(normalized, predictions)
            ],
        }
        sys.stdout.write(json.dumps(response))
    except Exception as error:
        sys.stderr.write(str(error))
        sys.stdout.write(json.dumps({"success": False, "error": str(error), "predictions": []}))
        sys.exit(1)


if __name__ == "__main__":
    main()

