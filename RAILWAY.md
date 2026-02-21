# Railway Deployment Guide

## Setup

### 1. Deploy Backend Service

1. Create a new service from your GitHub repo
2. Select the `backend` folder as the root directory
3. Add a PostgreSQL database to your project
4. Set these environment variables:
   ```
   NODE_ENV=production
   PORT=3000
   POSTGRES_HOST=${{Postgres.PGHOST}}
   POSTGRES_NAME=${{Postgres.PGDATABASE}}
   POSTGRES_USER=${{Postgres.PGUSER}}
   POSTGRES_PASSWORD=${{Postgres.PGPASSWORD}}
   ACCESS_TOKEN_SECRET=<generate-random-string>
   REFRESH_TOKEN_SECRET=<generate-random-string>
   ```
5. Deploy and note the backend URL (e.g., `https://your-backend.up.railway.app`)

### 2. Deploy Frontend Service

1. Create another service from the same GitHub repo
2. Select the `frontend` folder as the root directory
3. Set these environment variables:
   ```
   VITE_API_URL=https://your-backend.up.railway.app
   ```
4. Deploy

### 3. Test

Visit your frontend URL and you should be able to register/login and use the app.

## Environment Variables Reference

### Backend
- `NODE_ENV`: Set to `production`
- `PORT`: `3000` (Railway auto-assigns public port)
- `POSTGRES_*`: Database connection (use Railway's template variables)
- `ACCESS_TOKEN_SECRET`: Random secret for JWT tokens
- `REFRESH_TOKEN_SECRET`: Random secret for refresh tokens

### Frontend
- `VITE_API_URL`: Your backend Railway URL (must be set as a build-time variable)

## Notes

- The frontend is built with the backend URL baked in at build time
- No nginx proxying needed - API calls go directly to backend
- Backend and frontend are separate services
- PostgreSQL database is a separate Railway resource
