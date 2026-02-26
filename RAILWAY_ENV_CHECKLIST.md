# Railway Environment Variables Checklist

## Frontend Service Variables

Required environment variables for the frontend service on Railway:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://taskflow-pro-backend-production.up.railway.app/api/v1

# Optional: WebSocket URL (if using real-time features)
NEXT_PUBLIC_WS_URL=wss://taskflow-pro-backend-production.up.railway.app
```

## Backend Service Variables

Required environment variables for the backend service on Railway:

```bash
# Node Environment
NODE_ENV=production

# Server Configuration
PORT=$PORT  # Railway auto-assigns this
FRONTEND_URL=https://taskflow-pro-frontend-production.up.railway.app

# Firebase/Firestore Configuration (CRITICAL - Required for database)
FIREBASE_SERVICE_ACCOUNT=<your-firebase-service-account-json-as-single-line-string>

# JWT Configuration (generate secure secrets)
JWT_SECRET=<your-secure-jwt-secret-min-32-chars>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<your-secure-refresh-secret-min-32-chars>
JWT_REFRESH_EXPIRES_IN=7d

# Redis Configuration (use Railway Redis plugin or external Redis)
REDIS_HOST=${{Redis.REDIS_HOST}}  # Auto-populated by Railway if using Redis plugin
REDIS_PORT=${{Redis.REDIS_PORT}}  # Auto-populated by Railway
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}  # Auto-populated by Railway

# Email Configuration (Brevo/SendGrid)
BREVO_API_KEY=<your-brevo-api-key>
FROM_EMAIL=noreply@yourdomain.com
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<your-brevo-smtp-user>
SMTP_PASS=<your-brevo-smtp-password>
SMTP_FROM=TaskFlow Pro <noreply@yourdomain.com>

# SMS Configuration (Fast2SMS or MSG91)
FAST2SMS_API_KEY=<your-fast2sms-api-key>
MSG91_API_KEY=<your-msg91-api-key>
MSG91_SENDER_ID=TXTLCL

# Optional: Twilio (if using)
TWILIO_ACCOUNT_SID=<your-twilio-account-sid>
TWILIO_AUTH_TOKEN=<your-twilio-auth-token>
TWILIO_PHONE_NUMBER=<your-twilio-phone>
TWILIO_WHATSAPP_NUMBER=<your-twilio-whatsapp>
```

### CRITICAL: Firebase Service Account Setup

The `FIREBASE_SERVICE_ACCOUNT` must be a single-line JSON string. To get it:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one)
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file
6. Convert it to a single-line string (remove all newlines and extra spaces)
7. Set it as the `FIREBASE_SERVICE_ACCOUNT` environment variable

**Example format:**
```json
{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@....iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"...","universe_domain":"googleapis.com"}
```

**Important:** Keep the `\n` characters in the private_key field - they are required!

## How to Set Variables in Railway

### Via Dashboard:
1. Go to https://railway.app/dashboard
2. Select your project
3. Click on the service (frontend or backend)
4. Click on the **Variables** tab
5. Click **+ New Variable**
6. Enter variable name and value
7. Click **Add**
8. Railway will automatically redeploy

### Via Railway CLI:
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Set a variable
railway variables --set VARIABLE_NAME=value

# Or set multiple variables from a file
railway variables --set-from-file .env.production
```

## Railway Plugins to Add

### Firebase/Firestore (Primary Database)
This app uses Firebase/Firestore as its database. You need to:

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Firestore Database
3. Generate a service account key (see above)
4. Set the `FIREBASE_SERVICE_ACCOUNT` environment variable

### Redis (Optional - for caching and queues)
   - Click **+ New** → **Database** → **Add Redis**
   - Automatically sets `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

## Verification Commands

After setting variables, verify your deployment:

```bash
# Check frontend
curl https://taskflow-pro-frontend-production.up.railway.app

# Check backend health
curl https://taskflow-pro-backend-production.up.railway.app/api/v1/health

# Check backend API docs (if enabled)
curl https://taskflow-pro-backend-production.up.railway.app/api/docs
```

## Common Issues

### Issue: Frontend can't connect to backend
**Solution**: Ensure `NEXT_PUBLIC_API_URL` is set in frontend service

### Issue: Backend returns 500 errors on all API calls
**Solution**: Ensure `FIREBASE_SERVICE_ACCOUNT` is set correctly in backend service. This is the most common issue!

### Issue: CORS errors
**Solution**: Ensure `FRONTEND_URL` is set correctly in backend service

### Issue: Database connection fails
**Solution**: Check `FIREBASE_SERVICE_ACCOUNT` is valid JSON and properly formatted

### Issue: Redis connection fails
**Solution**: Check Redis variables are set and Redis plugin is added (or use external Redis)

## Security Notes

- Never commit `.env` files with real secrets to git
- Use Railway's secret management for sensitive data
- Rotate JWT secrets regularly
- Use strong, unique passwords for all services
- Enable 2FA on your Railway account
