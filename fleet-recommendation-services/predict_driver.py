import json
import os
import sys
import joblib
import pandas as pd

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "driver_pipeline.pkl")
FEATURE_ORDER = [
    "experienceYears",
    "rating",
    "completedTrips",
    "successRate",
    "regionMatch",
    "medicalCheckValid",
    "tripDistance",
    "licenseType",
]


def clamp_score(value):
    return float(max(0, min(100, value)))


def normalize_driver(item):
    return {
        "id": item.get("id"),
        "experienceYears": max(float(item.get("experienceYears", 1) or 1), 0),
        "rating": max(0.0, min(5.0, float(item.get("rating", 3.5) or 3.5))),
        "completedTrips": max(float(item.get("completedTrips", 0) or 0), 0),
        "successRate": max(0.0, min(1.0, float(item.get("successRate", 0.75) or 0.75))),
        "regionMatch": int(item.get("regionMatch", 0) or 0),
        "medicalCheckValid": int(item.get("medicalCheckValid", 1) or 1),
        "tripDistance": max(float(item.get("tripDistance", 0) or 0), 0),
        "licenseType": str(item.get("licenseType", "B") or "B").upper(),
    }


def main():
    try:
        payload = json.loads(sys.stdin.read() or "{}")
        drivers = payload.get("drivers")
        if not isinstance(drivers, list):
            single = payload.get("driver")
            drivers = [single] if isinstance(single, dict) else []
        if not drivers:
            raise ValueError("No drivers provided")

        pipeline = joblib.load(MODEL_PATH)
        normalized = [normalize_driver(item) for item in drivers]
        frame = pd.DataFrame(normalized)[FEATURE_ORDER]
        predictions = pipeline.predict(frame)

        response = {
            "success": True,
            "predictions": [
                {"driver_id": item["id"], "score": clamp_score(score)}
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

