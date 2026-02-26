# Quick Fix for 404 and 500 Errors

## The Problems

1. **404 Errors**: Frontend can't reach backend (missing `NEXT_PUBLIC_API_URL`)
2. **500 Errors**: Backend crashes on database access (missing `FIREBASE_SERVICE_ACCOUNT`)

## The Solutions

### Fix 1: Frontend Connection (404 Errors)

1. Go to https://railway.app/dashboard
2. Click on your **frontend service** (taskflow-pro-frontend)
3. Click the **Variables** tab
4. Click **+ New Variable**
5. Add:
   ```
   NEXT_PUBLIC_API_URL=https://taskflow-pro-backend-production.up.railway.app/api/v1
   ```
6. Railway will automatically redeploy

### Fix 2: Backend Database (500 Errors) - CRITICAL

The backend uses Firebase/Firestore and needs the service account credentials:

1. Go to https://railway.app/dashboard
2. Click on your **backend service** (taskflow-pro-backend)
3. Click the **Variables** tab
4. Add this variable (you already have it in your local `.env` file):
   ```
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"taskflowpro-63af0",...}
   ```
   
   **Copy the entire JSON value from your `backend/.env` file** - it's the long JSON string that starts with `{"type":"service_account"...`

5. Railway will automatically redeploy

### Fix 3: Verify Backend CORS

1. Still in the **backend service** Variables tab
2. Verify this exists:
   ```
   FRONTEND_URL=https://taskflow-pro-frontend-production.up.railway.app
   ```
3. If not, add it

### Step 4: Test

Wait 2-3 minutes for Railway to redeploy both services, then:

1. Visit: https://taskflow-pro-frontend-production.up.railway.app/auth/register
2. Register a user - should work now
3. Visit: https://taskflow-pro-frontend-production.up.railway.app/dashboard
4. Should see your dashboard without 500 errors

## That's It!

The issues are just missing environment variables. Once you add them, Railway will redeploy and everything should work.

## Need More Help?

- See `RAILWAY_DEPLOYMENT_FIX.md` for detailed instructions
- See `RAILWAY_ENV_CHECKLIST.md` for all required variables
- Run `bash scripts/verify-deployment.sh` to test your deployment
