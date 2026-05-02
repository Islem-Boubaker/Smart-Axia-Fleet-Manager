import os
import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


DRIVER_FEATURES = [
    "experienceYears",
    "rating",
    "completedTrips",
    "successRate",
    "regionMatch",
    "medicalCheckValid",
    "tripDistance",
    "licenseType",
]
DRIVER_NUMERIC = [
    "experienceYears",
    "rating",
    "completedTrips",
    "successRate",
    "regionMatch",
    "medicalCheckValid",
    "tripDistance",
]
DRIVER_CATEGORICAL = ["licenseType"]

VEHICLE_FEATURES = [
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
VEHICLE_NUMERIC = [
    "mileage",
    "age",
    "conditionRating",
    "capacity",
    "tripDistance",
    "requiredCapacity",
    "maintenanceRisk",
]
VEHICLE_CATEGORICAL = ["fuelEfficiency", "engineType", "loadType"]


def _build_driver_training_frame(df: pd.DataFrame) -> pd.DataFrame:
    frame = pd.DataFrame()
    frame["experienceYears"] = pd.to_numeric(df.get("years_of_experience", 1), errors="coerce").fillna(1).clip(lower=0)
    frame["rating"] = pd.to_numeric(df.get("rating", 3.5), errors="coerce").fillna(3.5).clip(0, 5)
    frame["completedTrips"] = pd.to_numeric(df.get("completed_trips", 0), errors="coerce").fillna(0).clip(lower=0)
    completion_rate = pd.to_numeric(df.get("completion_rate", 0.75), errors="coerce").fillna(0.75).clip(0, 1)
    frame["successRate"] = completion_rate
    frame["regionMatch"] = pd.to_numeric(df.get("region_familiarity", 0), errors="coerce").fillna(0).clip(0, 1)
    frame["medicalCheckValid"] = (pd.to_numeric(df.get("last_medical_check_months", 12), errors="coerce").fillna(12) <= 12).astype(int)
    frame["tripDistance"] = pd.to_numeric(df.get("avg_trip_distance_km", 100), errors="coerce").fillna(100).clip(lower=0)
    frame["licenseType"] = df.get("license_type", "B").fillna("B").astype(str).str.upper()
    frame["score"] = pd.to_numeric(df["score"], errors="coerce").fillna(0).clip(0, 100)
    return frame


def _build_vehicle_training_frame(df: pd.DataFrame) -> pd.DataFrame:
    frame = pd.DataFrame()
    frame["mileage"] = pd.to_numeric(df.get("mileage", 50000), errors="coerce").fillna(50000).clip(lower=0)
    frame["age"] = pd.to_numeric(df.get("vehicle_age_years", 5), errors="coerce").fillna(5).clip(lower=0)
    frame["conditionRating"] = pd.to_numeric(df.get("condition_rating", 6), errors="coerce").fillna(6).clip(1, 10)
    frame["capacity"] = pd.to_numeric(df.get("capacity", 500), errors="coerce").fillna(500).clip(lower=0)
    fuel_num = pd.to_numeric(df.get("fuel_efficiency_num", 2), errors="coerce").fillna(2)
    frame["fuelEfficiency"] = fuel_num.map({1: "high", 2: "medium", 3: "low"}).fillna("medium")
    frame["engineType"] = df.get("engine_type", "diesel").fillna("diesel").astype(str).str.lower()
    raw_load = df.get("load_type", "general").fillna("general").astype(str).str.lower()
    frame["loadType"] = raw_load.replace({"standard": "general", "refrigerated": "cold", "bulk": "heavy", "hazardous": "heavy"})
    frame["tripDistance"] = pd.to_numeric(df.get("distance", 0), errors="coerce").fillna(0).clip(lower=0)
    frame["requiredCapacity"] = pd.to_numeric(df.get("required_capacity", 0), errors="coerce").fillna(0).clip(lower=0)
    maintenance_days = pd.to_numeric(df.get("last_maintenance_days", 60), errors="coerce").fillna(60).clip(lower=0)
    frame["maintenanceRisk"] = (1 - (maintenance_days / 365)).clip(lower=0, upper=1)
    frame["score"] = pd.to_numeric(df["score"], errors="coerce").fillna(0).clip(0, 100)
    return frame


def _build_pipeline(numeric_features, categorical_features):
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_features),
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
        ]
    )
    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", GradientBoostingRegressor(
                n_estimators=200,
                max_depth=5,
                learning_rate=0.07,
                subsample=0.85,
                random_state=42,
            )),
        ]
    )


def main():
    print("Training Fleet Recommendation Pipelines\n")
    os.makedirs("models", exist_ok=True)

    print("Loading driver training data from driver_data.csv...")
    driver_df_raw = pd.read_csv("driver_data.csv")
    driver_df = _build_driver_training_frame(driver_df_raw)
    driver_pipeline = _build_pipeline(DRIVER_NUMERIC, DRIVER_CATEGORICAL)
    driver_pipeline.fit(driver_df[DRIVER_FEATURES], driver_df["score"])
    joblib.dump(driver_pipeline, "models/driver_pipeline.pkl")
    print("Driver pipeline trained & saved -> models/driver_pipeline.pkl")

    print("Loading vehicle training data from vehicle_data.csv...")
    vehicle_df_raw = pd.read_csv("vehicle_data.csv")
    vehicle_df = _build_vehicle_training_frame(vehicle_df_raw)
    vehicle_pipeline = _build_pipeline(VEHICLE_NUMERIC, VEHICLE_CATEGORICAL)
    vehicle_pipeline.fit(vehicle_df[VEHICLE_FEATURES], vehicle_df["score"])
    joblib.dump(vehicle_pipeline, "models/vehicle_pipeline.pkl")
    print("Vehicle pipeline trained & saved -> models/vehicle_pipeline.pkl")

    print("All pipelines ready")


if __name__ == "__main__":
    main()