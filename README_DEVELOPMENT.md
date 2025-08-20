# Khandeshwar Management System - Development Setup

This document describes how to run the frontend against the backend API.

## Prerequisites

- Node.js 18+ 
- MySQL 8.0+ (for full backend functionality)
- Git

## Quick Start

### 1. Backend Setup

```bash
cd backend
cp .env.example .env  # Edit: set PORT=8081, CORS_ORIGINS=http://localhost:5173
npm install
npm run dev  # Starts on port 8081
```

### 2. Frontend Setup  

```bash
cd frontend
echo "VITE_BACKEND_URL=http://localhost:8081" > .env.local
npm install
npm run dev  # Starts on port 5173
```

### 3. Environment Configuration

**Frontend (.env.local):**
```bash
# Create frontend/.env.local
VITE_BACKEND_URL=http://localhost:8081
```

**Backend (.env):**
```bash
# Copy backend/.env.example to backend/.env and update:
PORT=8081
CORS_ORIGINS=http://localhost:5173
# ... other settings from .env.example
```

The frontend is configured to connect to the backend via:
- `VITE_BACKEND_URL=http://localhost:8081` (in frontend/.env.local)
- Backend runs on port 8081 (configured in backend/.env)
- CORS allows the Vite dev server (5173)

### 4. Database Setup

For full functionality, set up MySQL:

```sql
CREATE DATABASE khandeshwar_db;
-- Database tables will be auto-created on first run
```

## API Endpoints

The backend provides these main endpoints:

- `GET /health` - Health check
- `POST /api/auth/login` - User authentication  
- `POST /api/auth/register` - User registration
- `GET /api/users` - User management (Admin only)
- `GET /api/shops` - Shop management
- `GET /api/tenants` - Tenant management  
- `GET /api/agreements` - Rental agreements
- `GET /api/loans` - Loan management
- `GET /api/transactions` - Financial transactions

## Authentication

The system uses JWT tokens for authentication:
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Tokens are stored in localStorage on the frontend

## Development Notes

- Mock data has been completely removed from frontend
- All data now flows through the backend API
- Frontend includes proper loading states and error handling
- Authentication is handled via React Context
- Data management is centralized in DataContext

## Testing

Test the API connection:
```bash
curl http://localhost:8081/api/health
```

This should return a successful health check response.