# ─── Stage 1: builder ─────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# Install only what's needed to compile wheels (no caching bloat in final image)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install into an isolated prefix so we can COPY just this tree into production
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ─── Stage 2: production ──────────────────────────────────────────────────────
FROM python:3.11-slim AS production

# Non-root user for security
RUN groupadd --system --gid 1001 appgroup \
 && useradd  --system --uid 1001 --gid appgroup appuser

WORKDIR /app

# Pull only the installed packages from the builder stage
COPY --from=builder /install /usr/local

# Copy application source (no CSVs, no train.py — see .dockerignore)
COPY app.py model.py predict_driver.py predict_vehicle.py ./

# Bake model artefacts into the image (required — Azure cannot mount volumes)
COPY models/ ./models/

# Ownership so the non-root user can write to /app if needed (e.g. temp files)
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

# --timeout=120 gives slow ML inference headroom on Basic-tier CPU
ENTRYPOINT ["gunicorn", "--bind=0.0.0.0:8000", "--workers=2", "--timeout=120", "--access-logfile=-", "--error-logfile=-", "app:app"]
