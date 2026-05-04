# Fleet Recommendation ML Service

A Python Flask microservice that scores and ranks **drivers** and **vehicles** for fleet trip planning using Gradient Boosting ML models.

Designed to work alongside a Node.js fleet management backend. If this service is unavailable, the Node.js backend automatically falls back to rule-based scoring.

---

## What It Does

- **`/`** — root endpoint with API info and status
- **`/health`** — health check (used by Node.js to detect if ML is available)
- **`/batch-predict-drivers`** — scores a list of drivers for a given trip
- **`/batch-predict-vehicles`** — scores a list of vehicles for a given trip
- **`/predict-driver`** — scores a single driver
- **`/predict-vehicle`** — scores a single vehicle

All scores are between **0 and 100**.

---

## Project Structure

```
fleet-recommendation-services/
├── models/                  # Generated after running train.py (git-ignored)
│   ├── driver_model.pkl
│   └── vehicle_model.pkl
├── model.py                 # DriverModel and VehicleModel classes
├── train.py                 # Generates synthetic data and trains both models
├── app.py                   # Flask API server
├── requirements.txt         # Project dependencies
├── .gitignore               # Python and model file exclusions
└── README.md
```

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/Smart-Axia-Fleet-Manager.git
cd fleet-recommendation-services

python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Train the Models

```bash
python train.py
```

This generates synthetic training data and saves the models to `models/`.  
You only need to run this **once** (or whenever you want to retrain the models).

### 3. Start the Server

```bash
python app.py
```

The server runs on `http://localhost:5000`. It is configured with `debug=True` for automatic reloading during development.

---

## API Examples

### Health Check
```bash
curl http://localhost:5000/health
```
```json
{ "status": "healthy", "model_loaded": true }
```

### Predict Best Drivers
```bash
curl -X POST http://localhost:5000/batch-predict-drivers \
  -H "Content-Type: application/json" \
  -d '{
    "drivers": [
      {
        "id": "uuid-1",
        "yearsOfExperience": 5,
        "rating": 4.8,
        "completedTrips": 120,
        "totalTrips": 125,
        "familiarRegions": ["Sfax", "Tunis"]
      }
    ],
    "trip": {
      "distance": 200,
      "requiredCapacity": 500,
      "region": "Sfax"
    }
  }'
```

---

## Why `models/` is git-ignored

The `.pkl` model files are binary and can be regenerated easily with `train.py`. Committing them would unnecessarily bloat the repository. Anyone cloning the project can simply run `python train.py` to recreate them.

---

## Tech Stack

- **Python**: 3.14+ (Compatible with latest releases)
- **Framework**: Flask 3.0
- **ML Library**: scikit-learn 1.5+ (Gradient Boosting)
- **Data**: pandas / numpy 2.x
- **Persistence**: joblib