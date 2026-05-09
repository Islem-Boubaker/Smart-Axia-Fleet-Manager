# ─── Stage 1: builder — install deps + train models ──────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy training resources (CSVs + scripts needed at build time only)
COPY train.py model.py driver_data.csv vehicle_data.csv ./

# Train all four models; outputs land in /build/models/
RUN python train.py


# ─── Stage 2: production — lean runtime image ─────────────────────────────────
FROM python:3.11-slim AS production

# Non-root user for security
RUN groupadd --system --gid 1001 appgroup \
 && useradd  --system --uid 1001 --gid appgroup appuser

WORKDIR /app

# Copy only the installed packages from the builder (no gcc, no CSVs, no train.py)
COPY --from=builder /usr/local/lib /usr/local/lib
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application source
COPY app.py model.py predict_driver.py predict_vehicle.py ./

# Copy the freshly-trained model artefacts (baked into the image)
COPY --from=builder /build/models ./models/

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

# --timeout=120 gives slow ML inference headroom on Basic-tier CPU
ENTRYPOINT ["gunicorn", "--bind=0.0.0.0:8000", "--workers=2", "--timeout=120", "--access-logfile=-", "--error-logfile=-", "app:app"]
