"""
Flask ML API Server
Endpoints consumed by Node.js recommendation service
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from model import DriverModel, VehicleModel
import os

app = Flask(__name__)
CORS(app)

# ─── Load models on startup ───────────────────────────────────
driver_model = DriverModel()
vehicle_model = VehicleModel()

try:
    driver_model.load('models/driver_model.pkl')
    print("Driver model loaded")
except Exception as e:
    print(f"Driver model not found: {e}. Run python train.py first.")

try:
    vehicle_model.load('models/vehicle_model.pkl')
    print("Vehicle model loaded")
except Exception as e:
    print(f"Vehicle model not found: {e}. Run python train.py first.")


# ─── Root ─────────────────────────────────────────────────────
@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'message': 'Smart Axia Fleet Recommendation API',
        'status': 'running',
        'endpoints': [
            '/health',
            '/predict-driver (POST)',
            '/predict-vehicle (POST)',
            '/batch-predict-drivers (POST)',
            '/batch-predict-vehicles (POST)'
        ]
    })


# ─── Health ───────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': driver_model.model is not None and vehicle_model.model is not None,
    })


# ─── Predict single driver ────────────────────────────────────
@app.route('/predict-driver', methods=['POST'])
def predict_driver():
    try:
        data = request.json
        score = driver_model.predict(data['driver'], data['trip'])
        return jsonify({'success': True, 'predicted_score': score})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ─── Predict single vehicle ───────────────────────────────────
@app.route('/predict-vehicle', methods=['POST'])
def predict_vehicle():
    try:
        data = request.json
        score = vehicle_model.predict(data['vehicle'], data['trip'])
        return jsonify({'success': True, 'predicted_score': score})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ─── Batch predict drivers ────────────────────────────────────
@app.route('/batch-predict-drivers', methods=['POST'])
def batch_predict_drivers():
    try:
        data = request.json
        trip = data['trip']
        results = []
        for d in data['drivers']:
            score = driver_model.predict(d, trip)
            results.append({'driver_id': d['id'], 'predicted_score': score})
        return jsonify({'success': True, 'predictions': results})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ─── Batch predict vehicles ───────────────────────────────────
@app.route('/batch-predict-vehicles', methods=['POST'])
def batch_predict_vehicles():
    try:
        data = request.json
        trip = data['trip']
        results = []
        for v in data['vehicles']:
            score = vehicle_model.predict(v, trip)
            results.append({'vehicle_id': v['id'], 'predicted_score': score})
        return jsonify({'success': True, 'predictions': results})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)