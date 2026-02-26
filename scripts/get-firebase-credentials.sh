#!/bin/bash

# Script to extract Firebase credentials from backend/.env file
# This makes it easy to copy the value for Railway

echo "🔥 Firebase Credentials Extractor"
echo "=================================="
echo ""

ENV_FILE="backend/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: backend/.env file not found"
    echo "   Please ensure you're running this from the project root"
    exit 1
fi

# Extract the FIREBASE_SERVICE_ACCOUNT value
FIREBASE_CREDS=$(grep "^FIREBASE_SERVICE_ACCOUNT=" "$ENV_FILE" | cut -d'=' -f2-)

if [ -z "$FIREBASE_CREDS" ]; then
    echo "❌ Error: FIREBASE_SERVICE_ACCOUNT not found in backend/.env"
    echo "   Please add your Firebase service account credentials to backend/.env"
    exit 1
fi

echo "✅ Firebase credentials found!"
echo ""
echo "📋 Copy this value and paste it into Railway:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$FIREBASE_CREDS"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Steps to add to Railway:"
echo "   1. Go to https://railway.app/dashboard"
echo "   2. Click on your backend service"
echo "   3. Go to Variables tab"
echo "   4. Click + New Variable"
echo "   5. Name: FIREBASE_SERVICE_ACCOUNT"
echo "   6. Value: Paste the JSON above"
echo "   7. Click Add"
echo ""
echo "⚠️  Important: Make sure to copy the ENTIRE JSON string including the curly braces!"
echo ""
