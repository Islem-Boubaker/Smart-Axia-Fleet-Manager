"""
Fleet Recommendation ML Model
Two separate models:
  - DriverModel  → predicts driver suitability score (0-100)
  - VehicleModel → predicts vehicle suitability score (0-100)
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
import joblib
import os


# ─────────────────────────────────────────────
# DRIVER MODEL
# ─────────────────────────────────────────────
class DriverModel:
    FEATURES = [
        'years_of_experience',
        'rating',
        'completion_rate',
        'total_trips',
        'region_familiarity',  # 1 = familiar, 0 = not
    ]

    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()

    def extract_features(self, driver: dict, trip: dict) -> np.ndarray:
        familiar = int(
            trip.get('region', '').lower() in
            [r.lower() for r in driver.get('familiarRegions', [])]
        )
        completed = driver.get('completedTrips', 0) or 0
        total = max(driver.get('totalTrips', 1) or 1, 1)

        return np.array([[
            driver.get('yearsOfExperience', 0) or 0,
            driver.get('rating', 3.0) or 3.0,
            completed / total,
            total,
            familiar,
        ]])

    def train(self, df: pd.DataFrame):
        X = df[self.FEATURES].values
        y = df['score'].values
        X_scaled = self.scaler.fit_transform(X)
        self.model = GradientBoostingRegressor(
            n_estimators=150, max_depth=4, learning_rate=0.08, random_state=42
        )
        self.model.fit(X_scaled, y)

    def predict(self, driver: dict, trip: dict) -> float:
        if self.model is None:
            raise RuntimeError("Driver model not trained")
        X = self.extract_features(driver, trip)
        X_scaled = self.scaler.transform(X)
        score = self.model.predict(X_scaled)[0]
        return float(np.clip(score, 0, 100))

    def save(self, path='models/driver_model.pkl'):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump({'model': self.model, 'scaler': self.scaler}, path)

    def load(self, path='models/driver_model.pkl'):
        data = joblib.load(path)
        self.model = data['model']
        self.scaler = data['scaler']


# ─────────────────────────────────────────────
# VEHICLE MODEL
# ─────────────────────────────────────────────
class VehicleModel:
    FEATURES = [
        'mileage',
        'condition_rating',
        'capacity',
        'fuel_efficiency_num',   # high=1, medium=2, low=3
        'distance',
        'required_capacity',
        'capacity_utilization',  # required / vehicle capacity
    ]

    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()

    def extract_features(self, vehicle: dict, trip: dict) -> np.ndarray:
        fuel_map = {'high': 1, 'medium': 2, 'low': 3}
        fuel_num = fuel_map.get(vehicle.get('fuelEfficiency', 'medium'), 2)

        veh_cap = vehicle.get('capacity', 1) or 1
        req_cap = trip.get('requiredCapacity', 0) or 0
        utilization = req_cap / max(veh_cap, 1)

        return np.array([[
            vehicle.get('mileage', 0) or 0,
            vehicle.get('conditionRating', 7) or 7,
            veh_cap,
            fuel_num,
            trip.get('distance', 0) or 0,
            req_cap,
            utilization,
        ]])

    def train(self, df: pd.DataFrame):
        X = df[self.FEATURES].values
        y = df['score'].values
        X_scaled = self.scaler.fit_transform(X)
        self.model = GradientBoostingRegressor(
            n_estimators=150, max_depth=4, learning_rate=0.08, random_state=42
        )
        self.model.fit(X_scaled, y)

    def predict(self, vehicle: dict, trip: dict) -> float:
        if self.model is None:
            raise RuntimeError("Vehicle model not trained")
        X = self.extract_features(vehicle, trip)
        X_scaled = self.scaler.transform(X)
        score = self.model.predict(X_scaled)[0]
        return float(np.clip(score, 0, 100))

    def save(self, path='models/vehicle_model.pkl'):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump({'model': self.model, 'scaler': self.scaler}, path)

    def load(self, path='models/vehicle_model.pkl'):
        data = joblib.load(path)
        self.model = data['model']
        self.scaler = data['scaler']