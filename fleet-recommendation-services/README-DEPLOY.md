# Fleet ML Recommendation Service — Deployment Guide

## Local Development

### Build the image
```bash
docker build -t fleet-ml .
```

### Run the container
```bash
docker run -p 8000:8000 fleet-ml
```

### Run with docker-compose (recommended)
```bash
docker compose up --build
```

### Test the health endpoint
```bash
curl http://localhost:8000/health
# Expected: {"models":{"driver":"loaded","vehicle":"loaded"},"status":"ok"}
```

### Test a prediction
```bash
curl -X POST http://localhost:8000/predict-driver \
  -H "Content-Type: application/json" \
  -d '{
    "driver": {"yearsOfExperience": 5, "rating": 4.2, "licenseType": "B"},
    "trip":   {"region": "North", "distance": 120}
  }'
```

---

## Production Deployment (Azure App Service + ACR)

### Required GitHub Actions secrets

| Secret | Where to find it |
|--------|-----------------|
| `AZURE_CREDENTIALS` | Azure Portal → Service Principal JSON (same as backend) |
| `ACR_LOGIN_SERVER` | Azure Portal → Container Registry → Login server (e.g. `myacr.azurecr.io`) |
| `ACR_USERNAME` | Azure Portal → Container Registry → Access keys → Username |
| `ACR_PASSWORD` | Azure Portal → Container Registry → Access keys → Password |

### How deployment works

1. Push any change inside `fleet-recommendation-services/` to `main`
2. GitHub Actions builds the Docker image and pushes it to ACR tagged with the commit SHA
3. Azure App Service pulls the new image and restarts

### Manual trigger

Go to **GitHub → Actions → Deploy Fleet ML Recommendation → Run workflow**

---

## Azure App Service configuration

Set the following in **Azure Portal → App Service → Configuration → Application Settings**:

| Key | Value |
|-----|-------|
| `WEBSITES_PORT` | `8000` |
| `PORT` | `8000` |

The App Service must be configured to use a container image from ACR:
- **Deployment Center → Container type:** Single container
- **Registry:** your ACR
- **Image:** `fleet-ml`
- **Tag:** `latest` (or pin to a SHA for immutable deploys)

Also ensure the App Service identity has **AcrPull** role on the ACR resource.

---

## Environment variables

The service has no required secrets at runtime (models are baked into the image).  
Optional variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `8000` | Listened port (gunicorn bind) — overridden by Azure |

---

## Notes

- **Models are baked into the image.** To update a model, retrain, replace the `.pkl` files, and redeploy.
- The `/health` endpoint returns HTTP 200 when both models are loaded, 503 when either failed. Azure health checks use this route.
- `gunicorn` runs with 2 workers — suited for Basic-tier CPUs. Increase for Standard/Premium.
