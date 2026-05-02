# Recommendation Testing Guide

Use these examples to validate end-to-end backend/ML compatibility.

## Prerequisites

- Backend running (default `http://localhost:3000`).
- Trained ML pipelines:
  - `fleet-recommendation-services/models/driver_pipeline.pkl`
  - `fleet-recommendation-services/models/vehicle_pipeline.pkl`
- Auth token with `ADMIN` or `MANAGER` role.
- Valid CSRF token header if CSRF protection is enabled in your environment.

## 1) Recommend Drivers For Trip

```bash
curl -X POST http://localhost:3000/trips/recommendations \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: CSRF_TOKEN" \
  -d '{"tripId":"TRIP_ID","action":"drivers","topN":5}'
```

## 2) Recommend Vehicles For Trip

```bash
curl -X POST http://localhost:3000/trips/recommendations \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: CSRF_TOKEN" \
  -d '{"tripId":"TRIP_ID","action":"vehicles","topN":5}'
```

## 3) Recommend Best Assignment

```bash
curl -X POST http://localhost:3000/trips/recommendations \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: CSRF_TOKEN" \
  -d '{"tripId":"TRIP_ID","action":"assignment","topN":5}'
```

## 3.1) Recommend Both Lists Using Only Trip Information

```bash
curl -X POST http://localhost:3000/trips/recommendations \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: CSRF_TOKEN" \
  -d '{
    "action":"assignment",
    "startTime":"2026-05-02T12:00:00.000Z",
    "endTime":"2026-05-02T16:00:00.000Z",
    "region":"Tunis",
    "distance":150,
    "requiredCapacity":800,
    "loadType":"general",
    "topN":5
  }'
```

## 4) Apply Best Recommendation

```bash
curl -X POST http://localhost:3000/trips/recommendations \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: CSRF_TOKEN" \
  -d '{"tripId":"TRIP_ID","action":"apply","topN":5}'
```

`action=apply` requires `tripId` because it updates an existing trip assignment in the database.

## 5) ML Unavailable Fallback

Temporarily set invalid script path:

```bash
set ML_DRIVER_SCRIPT=invalid.py
set ML_VEHICLE_SCRIPT=invalid.py
```

Then call recommendation endpoint and verify `source` values become fallback-based while response remains successful.

## 6) No Available Drivers

- Mark all drivers unavailable or create overlapping trips for the same time window.
- Call `action=drivers`.
- Expect `data.drivers` to be empty.

## 7) No Available Vehicles

- Put all vehicles in maintenance or unavailable status.
- Call `action=vehicles`.
- Expect `data.vehicles` to be empty.

## 8) Vehicle Under Maintenance Exclusion

- Create active maintenance (`pending` / `scheduled` / `in progress`) for a vehicle that overlaps trip time.
- Call `action=vehicles`.
- Ensure that vehicle is absent from ranked candidates.

## 9) Driver Overlap Exclusion

- Assign a driver to another overlapping trip.
- Call `action=drivers`.
- Ensure overlapping driver is absent.

## 10) Insufficient Capacity Exclusion

- Set a trip `requiredCapacity` greater than a vehicle's `capacity`.
- Call `action=vehicles`.
- Ensure low-capacity vehicle is absent.

