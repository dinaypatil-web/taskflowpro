# Free India-Based API Services Setup Guide

This guide helps you set up free API services for SMS, WhatsApp, and Email in TaskFlow Pro.

## 🚀 Quick Setup Summary

### 1. Email Service - Brevo (Free 300 emails/day)
- **Website**: https://www.brevo.com/
- **Free Tier**: 300 emails per day
- **Setup Time**: 5 minutes

### 2. SMS & WhatsApp - Fast2SMS (Free ₹50 credits)
- **Website**: https://www.fast2sms.com/
- **Free Tier**: ₹50 credits + Free WhatsApp API
- **Setup Time**: 10 minutes

### 3. Backup SMS - MSG91 (Free credits)
- **Website**: https://msg91.com/
- **Free Tier**: Free credits for testing
- **Setup Time**: 5 minutes

## 📧 Email Setup (Brevo)

### Step 1: Create Brevo Account
1. Go to https://www.brevo.com/
2. Click "Sign up free"
3. Fill in your details and verify email
4. Complete account setup

### Step 2: Get API Key
1. Login to Brevo dashboard
2. Go to "SMTP & API" → "API Keys"
3. Click "Generate a new API key"
4. Copy the API key

### Step 3: Configure Environment
Add to your `backend/.env` file:
```env
BREVO_API_KEY=your-brevo-api-key-here
FROM_EMAIL=noreply@yourdomain.com
```

## 📱 SMS & WhatsApp Setup (Fast2SMS)

### Step 1: Create Fast2SMS Account
1. Go to https://www.fast2sms.com/
2. Click "Sign Up"
3. Verify your mobile number
4. Complete KYC if required

### Step 2: Get API Key
1. Login to Fast2SMS dashboard
2. Go to "Dev API" section
3. Copy your API key from the dashboard

### Step 3: Configure Environment
Add to your `backend/.env` file:
```env
FAST2SMS_API_KEY=your-fast2sms-api-key-here
```

## 🔄 Backup SMS Setup (MSG91)

### Step 1: Create MSG91 Account
1. Go to https://msg91.com/
2. Sign up with your details
3. Verify your account

### Step 2: Get API Key
1. Login to MSG91 dashboard
2. Go to API section
3. Copy your Auth Key

### Step 3: Configure Environment
Add to your `backend/.env` file:
```env
MSG91_API_KEY=your-msg91-api-key-here
MSG91_SENDER_ID=TXTLCL
```

## ✅ Testing Your Setup

### Test Email Service
```bash
# In your backend directory
curl -X POST http://localhost:3002/api/v1/test/email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "subject": "Test Email"}'
```

### Test SMS Service
```bash
curl -X POST http://localhost:3002/api/v1/test/sms \
  -H "Content-Type: application/json" \
  -d '{"to": "+919876543210", "message": "Test SMS"}'
```

### Test WhatsApp Service
```bash
curl -X POST http://localhost:3002/api/v1/test/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"to": "+919876543210", "message": "Test WhatsApp"}'
```

## 🔧 Configuration Notes

### Phone Number Format
- **SMS**: 10-digit Indian numbers (9876543210)
- **WhatsApp**: With country code (919876543210)
- **Input**: Accepts +91, 91, or 10-digit formats

### Rate Limits
- **Brevo**: 300 emails/day (free tier)
- **Fast2SMS**: Based on credits (₹50 free)
- **MSG91**: Based on credits (free testing credits)

### Error Handling
The system automatically falls back to backup services if primary fails.

## 🚨 Important Notes

1. **KYC Requirements**: Some services may require KYC for full access
2. **DLT Registration**: Required for commercial SMS in India
3. **WhatsApp Business**: May require business verification
4. **Rate Limits**: Monitor usage to avoid hitting limits
5. **Testing**: Always test with your own numbers first

## 🆘 Troubleshooting

### Common Issues
1. **Invalid API Key**: Double-check the key in dashboard
2. **Phone Format**: Ensure correct format for Indian numbers
3. **Rate Limits**: Check if you've exceeded free tier limits
4. **Network Issues**: Verify internet connectivity

### Support Contacts
- **Brevo**: support@brevo.com
- **Fast2SMS**: support@fast2sms.com
- **MSG91**: support@msg91.com

## 🔄 Upgrading to Paid Plans

When you're ready to scale:
- **Brevo**: Starting from $25/month for 20K emails
- **Fast2SMS**: Pay-as-you-go pricing
- **MSG91**: Volume-based pricing

This setup gives you a fully functional notification system with minimal cost!