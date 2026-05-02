# Recommendation Contract

This document defines the canonical contract between `fleet-backend` and `fleet-recommendation-services`.

## Scoring Rules

- Score range is always clamped to `0..100`.
- Hard filtering happens before ML scoring.
- ML failure must fall back to deterministic rule-based scoring.

## Driver Feature Contract

```json
{
  "id": "uuid",
  "experienceYears": 1,
  "rating": 3.5,
  "completedTrips": 0,
  "successRate": 0.75,
  "regionMatch": 0,
  "medicalCheckValid": 1,
  "licenseType": "B",
  "tripDistance": 0
}
```

### Driver Field Rules

- `id`: required unique candidate identifier.
- `experienceYears`: non-negative number, default `1`.
- `rating`: number in `0..5`, default `3.5`.
- `completedTrips`: non-negative integer, default `0`.
- `successRate`: number in `0..1`, default `0.75`.
- `regionMatch`: `0|1`, default `0`.
- `medicalCheckValid`: `0|1`, default `1`.
- `licenseType`: one of `B|C|D|CE`, default `B`.
- `tripDistance`: non-negative number, default `0`.

## Vehicle Feature Contract

```json
{
  "id": "uuid",
  "mileage": 50000,
  "age": 5,
  "conditionRating": 6,
  "capacity": 500,
  "fuelEfficiency": "medium",
  "engineType": "diesel",
  "loadType": "general",
  "tripDistance": 0,
  "requiredCapacity": 0,
  "maintenanceRisk": 0.1
}
```

### Vehicle Field Rules

- `id`: required unique candidate identifier.
- `mileage`: non-negative number, default `50000`.
- `age`: non-negative number, default `5`.
- `conditionRating`: number in `1..10`, estimated from age/mileage when missing.
- `capacity`: non-negative number, estimated from type if missing.
- `fuelEfficiency`: one of `low|medium|high`, default `medium`.
- `engineType`: one of `diesel|petrol|hybrid|electric`, default `diesel`.
- `loadType`: one of `general|cold|fragile|heavy`, default `general`.
- `tripDistance`: non-negative number, default `0`.
- `requiredCapacity`: non-negative number, default `0`.
- `maintenanceRisk`: number in `0..1` (higher means riskier), derived from maintenance recency and active conflicts.

## Trip Recommendation Input Contract

```json
{
  "tripId": "uuid",
  "startTime": "2026-05-02T10:00:00.000Z",
  "endTime": "2026-05-02T14:00:00.000Z",
  "region": "Tunis",
  "distance": 150,
  "requiredCapacity": 800,
  "loadType": "general",
  "topN": 5,
  "includeRankedLists": true,
  "applyBest": false
}
```

## Response Shape Contract

- Keep backend standard envelope `{ success, message, data }`.
- Include ranking metadata:
  - `score`: numeric final score
  - `rank`: 1-based
  - `reasons`: string list
  - `source`: `ml|fallback|ml_with_adjustments`

