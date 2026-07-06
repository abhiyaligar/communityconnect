# Stage 1: Build dependencies
FROM python:3.12-slim AS builder

WORKDIR /install

# Install build dependencies for libraries with C extensions (psycopg2, Pillow, cryptography, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /requirements.txt
RUN pip install --no-cache-dir --prefix=/install -r /requirements.txt

# Stage 2: Final runtime image
FROM python:3.12-slim

WORKDIR /app

# Install runtime system libraries (e.g. libpq5 for PostgreSQL integration)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy python dependencies
COPY --from=builder /install /usr/local

# Copy all backend files to /app
COPY . /app

# Python environment configurations
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Fix directory permissions for non-root traversal
RUN chmod -R 755 /app

# Create a non-privileged system user for container security
RUN groupadd --system appgroup && useradd --system --gid appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser

CMD python -c "import os, sys; print('=== CONTAINER DEBUG START ==='); print('CWD:', os.getcwd()); print('PYTHONPATH:', os.environ.get('PYTHONPATH')); print('sys.path:', sys.path); print('Files in /app:', os.listdir('/app') if os.path.exists('/app') else 'Not Found'); print('Files in /app/app:', os.listdir('/app/app') if os.path.exists('/app/app') else 'Not Found'); print('=== CONTAINER DEBUG END ==='"
