# Troubleshooting 500 Errors on Railway

## Problem Description

You're seeing 500 Internal Server Error on these endpoints:
- `/api/v1/tasks`
- `/api/v1/stakeholders`
- `/api/v1/tasks/upcoming`
- And other data-related endpoints

## Root Cause

The backend is using **Firebase/Firestore** as its database, but the `FIREBASE_SERVICE_ACCOUNT` environment variable is not set on Railway. Without this, the backend cannot connect to the database and crashes when trying to access data.

## Solution

### Step 1: Get Your Firebase Credentials

You already have the Firebase credentials in your local `backend/.env` file. You need to copy them to Railway.

**Option A: Use the helper script (Linux/Mac/Git Bash)**
```bash
bash scripts/get-firebase-credentials.sh
```

**Option B: Manual extraction**
1. Open `backend/.env` file
2. Find the line starting with `FIREBASE_SERVICE_ACCOUNT=`
3. Copy everything after the `=` sign (the entire JSON object)

### Step 2: Add to Railway

1. Go to https://railway.app/dashboard
2. Select your project
3. Click on the **backend service** (taskflow-pro-backend)
4. Click the **Variables** tab
5. Click **+ New Variable**
6. Enter:
   - **Variable Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: Paste the entire JSON string from Step 1
7. Click **Add**
8. Railway will automatically redeploy the backend

### Step 3: Verify Other Required Variables

While you're in the backend Variables tab, ensure these are also set:

```bash
NODE_ENV=production
FRONTEND_URL=https://taskflow-pro-frontend-production.up.railway.app
JWT_SECRET=<your-jwt-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

You can copy these from your `backend/.env` file as well.

### Step 4: Wait for Deployment

Railway will automatically redeploy your backend service. This takes about 2-3 minutes.

### Step 5: Test

1. Visit: https://taskflow-pro-backend-production.up.railway.app/api/v1/health
   - Should return a 200 OK response

2. Visit your frontend: https://taskflow-pro-frontend-production.up.railway.app/dashboard
   - Should load without 500 errors

3. Try creating a task or stakeholder
   - Should work without errors

## Understanding the Error

The 500 errors happen because:

1. Frontend makes a request to backend (e.g., GET `/api/v1/tasks`)
2. Backend tries to query Firestore database
3. Firestore connection fails because `FIREBASE_SERVICE_ACCOUNT` is missing
4. Backend throws an exception
5. Returns 500 Internal Server Error to frontend

## Firebase/Firestore Setup

If you don't have Firebase credentials yet:

1. Go to https://console.firebase.google.com/
2. Create a new project (or select existing)
3. Enable Firestore Database:
   - Click "Firestore Database" in left menu
   - Click "Create database"
   - Choose production mode
   - Select a location
4. Generate service account:
   - Go to Project Settings (gear icon)
   - Click "Service Accounts" tab
   - Click "Generate New Private Key"
   - Download the JSON file
5. Convert to single-line JSON:
   - Open the downloaded JSON file
   - Remove all newlines and extra spaces (keep `\n` in private_key)
   - Copy the entire JSON string
6. Add to Railway as `FIREBASE_SERVICE_ACCOUNT`

## Checking Railway Logs

To see the actual error in Railway:

1. Go to Railway dashboard
2. Click on backend service
3. Click "Deployments" tab
4. Click on the latest deployment
5. Click "View Logs"

You should see errors like:
```
FIREBASE_SERVICE_ACCOUNT environment variable is not set
```

Or:
```
Failed to parse FIREBASE_SERVICE_ACCOUNT JSON
```

## Common Issues

### Issue: "Failed to parse FIREBASE_SERVICE_ACCOUNT JSON"
**Solution**: Ensure the JSON is properly formatted as a single line. The `private_key` field must keep the `\n` characters.

### Issue: "Permission denied" errors from Firestore
**Solution**: Check your Firestore security rules. For development, you can use:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Issue: Still getting 500 errors after adding credentials
**Solution**: 
1. Check Railway logs for specific error messages
2. Verify the JSON is valid (use a JSON validator)
3. Ensure the service account has Firestore permissions
4. Try redeploying manually

## Need More Help?

- Check `RAILWAY_ENV_CHECKLIST.md` for complete environment variable list
- Check `QUICK_FIX.md` for step-by-step fixes
- Review Railway deployment logs for specific errors
