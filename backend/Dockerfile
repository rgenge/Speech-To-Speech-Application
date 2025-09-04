# backend/Dockerfile
FROM python:3.11-slim

# Prevent Python from writing pyc files & buffering stdout
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set workdir
WORKDIR /app

# Install system dependencies (e.g., for psycopg2, ffmpeg if needed)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY backend/ .

# Expose Django port
EXPOSE 8000

# Run server (dev mode)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
