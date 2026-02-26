# Railway Deployment Fix Guide

## Problem
The frontend deployed on Railway is getting 404 errors when trying to reach the backend API because the `NEXT_PUBLIC_API_URL` environment variable is not configured.

## Root Cause
- Frontend is trying to connect to `http://localhost:3002/api/v1` (default fallback)
- Backend is actually at `https://taskflow-pro-backend-production.up.railway.app/api/v1`
- Environment variable `NEXT_PUBLIC_API_URL` was not set in Railway for the frontend service

## Solution

### Set Environment Variable in Railway (Recommended)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project
3. Click on the **frontend service**
4. Go to the **Variables** tab
5. Add the following variable:
   - **Variable**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://taskflow-pro-backend-production.up.railway.app/api/v1`
6. Click **Add** or **Save**
7. Railway will automatically redeploy your frontend

### Alternative: Use Railway CLI

```bash
# Install Railway CLI if not already installed
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Set the environment variable for frontend service
railway variables --set NEXT_PUBLIC_API_URL=https://taskflow-pro-backend-production.up.railway.app/api/v1

# Trigger redeploy
railway up
```

## Verification

After Railway redeploys the frontend, test the following:

1. Visit: `https://taskflow-pro-frontend-production.up.railway.app/auth/register`
2. Open browser DevTools → Network tab
3. Try to register a user
4. Verify the API call goes to: `https://taskflow-pro-backend-production.up.railway.app/api/v1/auth/register`
5. Should return 200/201 instead of 404

## Additional Notes

- The backend is correctly configured with the `/api/v1` prefix
- CORS is configured to allow the frontend URL
- The forgot-password 404 error should also be resolved after the redeploy
- Railway will automatically redeploy when you add/change environment variables

## Backend Configuration (Railway)

Also verify your backend environment variables on Railway include:

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project
3. Click on the **backend service**
4. Go to **Variables** tab
5. Ensure these are set:
   - `FRONTEND_URL`: `https://taskflow-pro-frontend-production.up.railway.app`
   - `NODE_ENV`: `production`
   - `PORT`: Railway will auto-assign this (usually via `$PORT`)
   - All other required variables (JWT secrets, database, etc.)

## Backend Health Check

Test if your backend is running:

```bash
curl https://taskflow-pro-backend-production.up.railway.app/api/v1/health
```

Should return a health status response.

## CORS Issues

If you still get CORS errors after setting the environment variable, the backend's `FRONTEND_URL` environment variable on Railway needs to be updated to:

```
FRONTEND_URL=https://taskflow-pro-frontend-production.up.railway.app
```

The backend CORS configuration in `main.ts` uses this variable to allow requests from your frontend.

## Quick Fix Summary

**Frontend Service (Railway):**
- Add variable: `NEXT_PUBLIC_API_URL` = `https://taskflow-pro-backend-production.up.railway.app/api/v1`

**Backend Service (Railway):**
- Verify variable: `FRONTEND_URL` = `https://taskflow-pro-frontend-production.up.railway.app`

Both services will auto-redeploy after variable changes.
