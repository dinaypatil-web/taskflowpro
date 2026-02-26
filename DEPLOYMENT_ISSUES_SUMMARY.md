# Deployment Issues Summary & Solutions

## Issues Identified

### 1. 404 Errors on `/auth/register` and other endpoints
**Cause**: Frontend doesn't know where the backend is located  
**Missing**: `NEXT_PUBLIC_API_URL` environment variable in frontend service

### 2. 500 Errors on `/api/v1/tasks`, `/api/v1/stakeholders`, etc.
**Cause**: Backend cannot connect to Firebase/Firestore database  
**Missing**: `FIREBASE_SERVICE_ACCOUNT` environment variable in backend service

## Quick Solutions

### For Frontend (404 Errors)

Add to Railway frontend service variables:
```
NEXT_PUBLIC_API_URL=https://taskflow-pro-backend-production.up.railway.app/api/v1
```

### For Backend (500 Errors)

Add to Railway backend service variables:
```
FIREBASE_SERVICE_ACCOUNT=<copy-from-backend/.env-file>
```

The value is the entire JSON object starting with `{"type":"service_account"...`

## Step-by-Step Fix

1. **Go to Railway Dashboard**: https://railway.app/dashboard

2. **Fix Frontend**:
   - Click frontend service
   - Variables tab → + New Variable
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://taskflow-pro-backend-production.up.railway.app/api/v1`

3. **Fix Backend**:
   - Click backend service
   - Variables tab → + New Variable
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: Copy from `backend/.env` file (the entire JSON string)

4. **Verify Backend CORS**:
   - Still in backend Variables
   - Ensure `FRONTEND_URL=https://taskflow-pro-frontend-production.up.railway.app`

5. **Wait for Deployment**: 2-3 minutes for both services to redeploy

6. **Test**: Visit your frontend and try using the app

## Documentation Created

- `QUICK_FIX.md` - Fast 3-step fix guide
- `RAILWAY_DEPLOYMENT_FIX.md` - Detailed Railway deployment guide
- `RAILWAY_ENV_CHECKLIST.md` - Complete environment variables list
- `TROUBLESHOOTING_500_ERRORS.md` - Deep dive into 500 error fixes
- `scripts/get-firebase-credentials.sh` - Helper to extract Firebase credentials
- `scripts/verify-deployment.sh` - Test your deployment

## Architecture Notes

- **Frontend**: Next.js app deployed on Railway
- **Backend**: NestJS API deployed on Railway
- **Database**: Firebase/Firestore (not PostgreSQL)
- **Cache**: Redis (optional)

## Important Environment Variables

### Frontend (Required)
- `NEXT_PUBLIC_API_URL` - Backend API URL

### Backend (Required)
- `FIREBASE_SERVICE_ACCOUNT` - Firebase credentials (JSON)
- `FRONTEND_URL` - Frontend URL for CORS
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `NODE_ENV` - Set to "production"

### Backend (Optional)
- Email service credentials (BREVO, SMTP)
- SMS service credentials (Fast2SMS, MSG91, Twilio)
- Redis connection details

## Next Steps After Fixing

1. Test user registration
2. Test login
3. Test creating tasks
4. Test creating stakeholders
5. Test dashboard loading
6. Test reminders and calendar features

## Getting Help

If issues persist:
1. Check Railway deployment logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Ensure Firebase project is properly configured
5. Check Firestore security rules

## Firebase Setup Reminder

If you need to set up Firebase from scratch:
1. Go to https://console.firebase.google.com/
2. Create project
3. Enable Firestore Database
4. Generate service account key
5. Copy JSON to Railway environment variable

## Security Notes

- Never commit `.env` files with real credentials
- Use Railway's secret management for sensitive data
- Rotate JWT secrets regularly
- Keep Firebase service account secure
- Enable 2FA on Railway and Firebase accounts
