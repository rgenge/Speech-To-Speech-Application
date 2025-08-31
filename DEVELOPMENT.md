# Docker Compose Setup

This project uses Docker Compose to manage two services: a backend and a frontend.

## Services

### Backend

- **Build Context**: `.`
- **Dockerfile**: `backend/Dockerfile`
- **Container Name**: `backend`
- **Ports**: `8000:8000`
- **Volumes**: `./backend:/app`
- **Environment**: `.env` file

### Frontend

- **Build Context**: `.`
- **Dockerfile**: `frontend/Dockerfile`
- **Container Name**: `frontend`
- **Ports**: `5173:5173`
- **Volumes**: `./frontend:/app`
- **Depends On**: `backend`

## Usage

1. Clone the repository
2. Run `docker-compose up --build` to start the services
3. Run `docker-compose down` to stop the services
## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env

GROQ_API_KEY=your-secret-key
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,https://your-backend-ip
VITE_BACKEND_IP=https://your-backend-ip

