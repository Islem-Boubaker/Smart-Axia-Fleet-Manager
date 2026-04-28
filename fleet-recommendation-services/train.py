

import numpy as np
import pandas as pd
from model import DriverModel, VehicleModel


def generate_driver_data(n=2000):
    np.random.seed(42)
    rows = []
    for _ in range(n):
        exp = np.random.randint(0, 12)
        rating = np.random.uniform(2.5, 5.0)
        total = np.random.randint(1, 300)
        completed = int(total * np.random.uniform(0.7, 1.0))
        completion_rate = completed / total
        familiar = np.random.choice([0, 1], p=[0.35, 0.65])

        # Target: driver suitability score
        score = (
            min(exp / 8, 1) * 25
            + (rating / 5) * 25
            + completion_rate * 20
            + familiar * 20
            + min(completed / 100, 1) * 10
            + np.random.normal(0, 4)
        )
        score = np.clip(score, 0, 100)

        rows.append({
            'years_of_experience': exp,
            'rating': rating,
            'completion_rate': completion_rate,
            'total_trips': total,
            'region_familiarity': familiar,
            'score': score,
        })
    return pd.DataFrame(rows)


def generate_vehicle_data(n=2000):
    np.random.seed(99)
    rows = []
    for _ in range(n):
        mileage = np.random.randint(0, 280000)
        condition = np.random.randint(3, 11)
        capacity = np.random.choice([300, 500, 800, 1000, 1500])
        fuel_num = np.random.choice([1, 2, 3], p=[0.3, 0.5, 0.2])  # 1=high
        distance = np.random.randint(20, 500)
        req_cap = np.random.randint(100, int(capacity * 0.95))
        utilization = req_cap / capacity

        # Ideal utilization 0.7-0.9
        cap_score = 30 if 0.7 <= utilization <= 0.9 else (20 if utilization >= 0.5 else 10)
        fuel_score = {1: 15, 2: 10, 3: 5}[fuel_num]

        score = (
            cap_score
            + (condition / 10) * 25
            + (1 - min(mileage / 250000, 1)) * 20
            + fuel_score
            + np.random.normal(0, 4)
        )
        score = np.clip(score, 0, 100)

        rows.append({
            'mileage': mileage,
            'condition_rating': condition,
            'capacity': capacity,
            'fuel_efficiency_num': fuel_num,
            'distance': distance,
            'required_capacity': req_cap,
            'capacity_utilization': utilization,
            'score': score,
        })
    return pd.DataFrame(rows)


def main():
    print("Training Fleet Recommendation Models\n")

    # ── Driver Model ──────────────────────────────────
    print("Generating driver training data...")
    driver_df = generate_driver_data(2000)
    driver_model = DriverModel()
    driver_model.train(driver_df)
    driver_model.save()
    print("Driver model trained & saved -> models/driver_model.pkl\n")

    # ── Vehicle Model ─────────────────────────────────
    print("Generating vehicle training data...")
    vehicle_df = generate_vehicle_data(2000)
    vehicle_model = VehicleModel()
    vehicle_model.train(vehicle_df)
    vehicle_model.save()
    print("Vehicle model trained & saved -> models/vehicle_model.pkl\n")

    print("All models ready!")


if __name__ == '__main__':
    main()