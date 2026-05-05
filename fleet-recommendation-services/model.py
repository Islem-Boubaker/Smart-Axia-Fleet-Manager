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
        'completed_trips',
        'region_familiarity',
        'on_time_delivery_rate',
        'avg_speed_kmh',
        'accidents_last_3_years',
        'night_shift_capable',
        'last_medical_check_months',
        'training_courses_completed',
        'avg_trip_distance_km',
        # encoded categoricals
        'license_type_B',
        'license_type_C',
    ]

    # Maps license letter → encoded columns
    LICENSE_TYPES = ['A', 'B', 'C']   # A is the baseline (dropped)

    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()

    # ── encode license_type one-hot (A is baseline) ──────────────
    @staticmethod
    def _encode_license(license_str: str) -> dict:
        return {
            'license_type_B': int(license_str.upper() == 'B'),
            'license_type_C': int(license_str.upper() == 'C'),
        }

    # ── called during training on the full DataFrame ─────────────
    def train(self, df: pd.DataFrame):
        df = df.copy()

        # one-hot encode license_type
        license_dummies = pd.get_dummies(df['license_type'], prefix='license_type')
        for col in ['license_type_B', 'license_type_C']:
            df[col] = license_dummies[col].astype(int) if col in license_dummies else 0

        X = df[self.FEATURES].values
        y = df['score'].values
        X_scaled = self.scaler.fit_transform(X)
        self.model = GradientBoostingRegressor(
            n_estimators=200, max_depth=5, learning_rate=0.07,
            subsample=0.85, random_state=42
        )
        self.model.fit(X_scaled, y)

    # ── called at inference time with raw dicts ───────────────────
    def extract_features(self, driver: dict, trip: dict) -> np.ndarray:
        familiar = int(
            trip.get('region', '').lower() in
            [r.lower() for r in driver.get('familiarRegions', [])]
        )
        total     = max(driver.get('totalTrips', 1) or 1, 1)
        completed = driver.get('completedTrips', 0) or 0

        license_enc = self._encode_license(driver.get('licenseType', 'A'))

        return np.array([[
            driver.get('yearsOfExperience', 0) or 0,
            driver.get('rating', 3.0) or 3.0,
            completed / total,
            total,
            completed,
            familiar,
            driver.get('onTimeDeliveryRate', 0.8) or 0.8,
            driver.get('avgSpeedKmh', 70) or 70,
            driver.get('accidentsLast3Years', 0) or 0,
            int(driver.get('nightShiftCapable', False)),
            driver.get('lastMedicalCheckMonths', 12) or 12,
            driver.get('trainingCoursesCompleted', 0) or 0,
            driver.get('avgTripDistanceKm', 100) or 100,
            license_enc['license_type_B'],
            license_enc['license_type_C'],
        ]])

    def predict(self, driver: dict, trip: dict) -> float:
        if self.model is None:
            raise RuntimeError("Driver model not trained")
        X = self.extract_features(driver, trip)
        X_scaled = self.scaler.transform(X)
        return float(np.clip(self.model.predict(X_scaled)[0], 0, 100))

    def save(self, path='models/driver_model.pkl'):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump({'model': self.model, 'scaler': self.scaler}, path)

    def load(self, path='models/driver_model.pkl'):
        data = joblib.load(path)
        self.model  = data['model']
        self.scaler = data['scaler']


# ─────────────────────────────────────────────
# VEHICLE MODEL
# ─────────────────────────────────────────────
class VehicleModel:
    FEATURES = [
        'mileage',
        'vehicle_age_years',
        'condition_rating',
        'capacity',
        'fuel_efficiency_num',
        'distance',
        'required_capacity',
        'capacity_utilization',
        'last_maintenance_days',
        'tire_condition',
        'avg_fuel_consumption_per_100km',
        'gps_tracker_installed',
        'ac_working',
        'breakdown_count_last_year',
        # encoded categoricals
        'engine_type_electric',
        'engine_type_petrol',
        'load_type_bulk',
        'load_type_fragile',
        'load_type_hazardous',
        'load_type_refrigerated',
    ]

    ENGINE_TYPES = ['diesel', 'electric', 'petrol']   # diesel = baseline
    LOAD_TYPES   = ['standard', 'bulk', 'fragile', 'hazardous', 'refrigerated']  # standard = baseline

    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()

    @staticmethod
    def _encode_engine(engine_str: str) -> dict:
        e = engine_str.lower()
        return {
            'engine_type_electric': int(e == 'electric'),
            'engine_type_petrol':   int(e == 'petrol'),
        }

    @staticmethod
    def _encode_load(load_str: str) -> dict:
        l = load_str.lower()
        return {
            'load_type_bulk':         int(l == 'bulk'),
            'load_type_fragile':      int(l == 'fragile'),
            'load_type_hazardous':    int(l == 'hazardous'),
            'load_type_refrigerated': int(l == 'refrigerated'),
        }

    def train(self, df: pd.DataFrame):
        df = df.copy()

        # one-hot encode engine_type (diesel = baseline)
        engine_dummies = pd.get_dummies(df['engine_type'], prefix='engine_type')
        for col in ['engine_type_electric', 'engine_type_petrol']:
            df[col] = engine_dummies[col].astype(int) if col in engine_dummies else 0

        # one-hot encode load_type (standard = baseline)
        load_dummies = pd.get_dummies(df['load_type'], prefix='load_type')
        for col in ['load_type_bulk', 'load_type_fragile', 'load_type_hazardous', 'load_type_refrigerated']:
            df[col] = load_dummies[col].astype(int) if col in load_dummies else 0

        X = df[self.FEATURES].values
        y = df['score'].values
        X_scaled = self.scaler.fit_transform(X)
        self.model = GradientBoostingRegressor(
            n_estimators=200, max_depth=5, learning_rate=0.07,
            subsample=0.85, random_state=42
        )
        self.model.fit(X_scaled, y)

    def extract_features(self, vehicle: dict, trip: dict) -> np.ndarray:
        fuel_map = {'high': 1, 'medium': 2, 'low': 3}
        fuel_num  = fuel_map.get(vehicle.get('fuelEfficiency', 'medium'), 2)

        veh_cap   = max(vehicle.get('capacity', 1) or 1, 1)
        req_cap   = trip.get('requiredCapacity', 0) or 0
        utilization = req_cap / veh_cap

        engine_enc = self._encode_engine(vehicle.get('engineType', 'diesel'))
        load_enc   = self._encode_load(trip.get('loadType', 'standard'))

        return np.array([[
            vehicle.get('mileage', 0) or 0,
            vehicle.get('vehicleAgeYears', 5) or 5,
            vehicle.get('conditionRating', 7) or 7,
            veh_cap,
            fuel_num,
            trip.get('distance', 0) or 0,
            req_cap,
            utilization,
            vehicle.get('lastMaintenanceDays', 30) or 30,
            vehicle.get('tireCondition', 3) or 3,
            vehicle.get('avgFuelConsumptionPer100km', 13.0) or 13.0,
            int(vehicle.get('gpsTrackerInstalled', False)),
            int(vehicle.get('acWorking', True)),
            vehicle.get('breakdownCountLastYear', 0) or 0,
            engine_enc['engine_type_electric'],
            engine_enc['engine_type_petrol'],
            load_enc['load_type_bulk'],
            load_enc['load_type_fragile'],
            load_enc['load_type_hazardous'],
            load_enc['load_type_refrigerated'],
        ]])

    def predict(self, vehicle: dict, trip: dict) -> float:
        if self.model is None:
            raise RuntimeError("Vehicle model not trained")
        X = self.extract_features(vehicle, trip)
        X_scaled = self.scaler.transform(X)
        return float(np.clip(self.model.predict(X_scaled)[0], 0, 100))

    def save(self, path='models/vehicle_model.pkl'):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump({'model': self.model, 'scaler': self.scaler}, path)

    def load(self, path='models/vehicle_model.pkl'):
        data = joblib.load(path)
        self.model  = data['model']
        self.scaler = data['scaler']