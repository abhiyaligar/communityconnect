# Stage 1: Build dependencies
FROM python:3.11-slim AS builder

WORKDIR /install

# Install build dependencies for libraries with C extensions (psycopg2, Pillow, cryptography, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /requirements.txt
RUN pip install --no-cache-dir --prefix=/install -r /requirements.txt

# Stage 2: Final runtime image
FROM python:3.11-slim

WORKDIR /app

# Install runtime system libraries (e.g. libpq5 for PostgreSQL integration)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /install /usr/local
COPY ./app /app/app
COPY ./alembic /app/alembic
COPY ./alembic.ini /app/alembic.ini

# Python environment configurations
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Create a non-privileged system user for container security
RUN groupadd --system appgroup && useradd --system --gid appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser

# Expose port and configure entrypoint
# GCP Cloud Run injects the PORT env variable (usually 8080).
# Using sh allows resolving the PORT environment variable dynamically, defaulting to 8000 locally.
EXPOSE 8000
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 4
