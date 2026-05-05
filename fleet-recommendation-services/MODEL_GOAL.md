# Fleet Recommendation Model Goal

## What this model is for

This project is a fleet recommendation service. Its goal is to **score and rank drivers and vehicles for a trip** so the system can choose the best match for a delivery or transport request.

The model does not try to predict a final business outcome like profit or route time. Instead, it learns a **suitability score from 0 to 100** for:

- a driver given a trip
- a vehicle given a trip

Higher scores mean a better match for the trip requirements.

## How it works

The service contains two separate regression models:

1. **DriverModel**
   - Estimates how suitable a driver is for a specific trip.
   - Uses experience, rating, completion history, delivery performance, region familiarity, medical check history, license type, and other driver-related features.

2. **VehicleModel**
   - Estimates how suitable a vehicle is for a specific trip.
   - Uses mileage, age, condition, capacity, fuel efficiency, maintenance history, engine type, load type, and trip distance/capacity features.

Both models are trained with **Gradient Boosting Regressor**, which learns patterns from historical data where each row already has a target `score`.

## Training data

The training scripts use two CSV files:

- `driver_data.csv` for driver scoring
- `vehicle_data.csv` for vehicle scoring

Each dataset contains historical examples of feature values and a labeled suitability score. During training, the code also scales numeric features with `StandardScaler` and one-hot encodes categorical values such as license type, engine type, and load type.

## What the model outputs

For a given trip request, the service returns:

- a predicted score for one driver or vehicle
- or a list of scores for multiple drivers or vehicles

These scores are used to rank candidates, so the fleet management system can pick the most appropriate driver or vehicle.

## Why this is useful

This model helps automate fleet planning by turning many operational factors into a single recommendation score. That makes it easier to:

- assign the right driver to the right trip
- assign the right vehicle to the right load
- compare multiple candidates quickly
- support a fallback decision process in the backend

## Important note

This is a **recommendation/scoring model**, not a fully autonomous decision-maker. It supports human or system selection by ranking options based on learned patterns from historical data.
