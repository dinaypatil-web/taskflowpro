#!/bin/bash

# Deployment Verification Script for Railway
# This script checks if your frontend and backend are properly configured

echo "🔍 TaskFlow Pro - Railway Deployment Verification"
echo "=================================================="
echo ""

# Configuration
FRONTEND_URL="https://taskflow-pro-frontend-production.up.railway.app"
BACKEND_URL="https://taskflow-pro-backend-production.up.railway.app"
BACKEND_API_URL="${BACKEND_URL}/api/v1"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test Backend Health
echo "1️⃣  Testing Backend Health..."
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_API_URL}/health")

if [ "$BACKEND_HEALTH" = "200" ]; then
    echo -e "${GREEN}✓ Backend is healthy (HTTP $BACKEND_HEALTH)${NC}"
else
    echo -e "${RED}✗ Backend health check failed (HTTP $BACKEND_HEALTH)${NC}"
    echo -e "${YELLOW}  Check if backend service is running on Railway${NC}"
fi
echo ""

# Test Backend Auth Endpoint
echo "2️⃣  Testing Backend Auth Endpoint..."
BACKEND_AUTH=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_API_URL}/auth/register" -X POST -H "Content-Type: application/json" -d '{}')

if [ "$BACKEND_AUTH" = "400" ] || [ "$BACKEND_AUTH" = "422" ]; then
    echo -e "${GREEN}✓ Auth endpoint is reachable (HTTP $BACKEND_AUTH - validation error expected)${NC}"
elif [ "$BACKEND_AUTH" = "404" ]; then
    echo -e "${RED}✗ Auth endpoint not found (HTTP $BACKEND_AUTH)${NC}"
    echo -e "${YELLOW}  Check if backend has /api/v1 prefix configured${NC}"
else
    echo -e "${YELLOW}⚠ Auth endpoint returned HTTP $BACKEND_AUTH${NC}"
fi
echo ""

# Test Frontend
echo "3️⃣  Testing Frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}")

if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Frontend is accessible (HTTP $FRONTEND_STATUS)${NC}"
else
    echo -e "${RED}✗ Frontend not accessible (HTTP $FRONTEND_STATUS)${NC}"
    echo -e "${YELLOW}  Check if frontend service is running on Railway${NC}"
fi
echo ""

# Test Frontend Register Page
echo "4️⃣  Testing Frontend Register Page..."
FRONTEND_REGISTER=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}/auth/register")

if [ "$FRONTEND_REGISTER" = "200" ]; then
    echo -e "${GREEN}✓ Register page is accessible (HTTP $FRONTEND_REGISTER)${NC}"
else
    echo -e "${RED}✗ Register page not found (HTTP $FRONTEND_REGISTER)${NC}"
fi
echo ""

# Check CORS
echo "5️⃣  Testing CORS Configuration..."
CORS_TEST=$(curl -s -H "Origin: ${FRONTEND_URL}" -H "Access-Control-Request-Method: POST" -X OPTIONS "${BACKEND_API_URL}/auth/register" -o /dev/null -w "%{http_code}")

if [ "$CORS_TEST" = "204" ] || [ "$CORS_TEST" = "200" ]; then
    echo -e "${GREEN}✓ CORS is properly configured (HTTP $CORS_TEST)${NC}"
else
    echo -e "${YELLOW}⚠ CORS preflight returned HTTP $CORS_TEST${NC}"
    echo -e "${YELLOW}  Verify FRONTEND_URL is set in backend environment variables${NC}"
fi
echo ""

# Summary
echo "=================================================="
echo "📋 Summary"
echo "=================================================="
echo ""

if [ "$BACKEND_HEALTH" = "200" ] && [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Both services are running${NC}"
    echo ""
    echo "If you're still seeing 404 errors in the browser:"
    echo "1. Check Railway frontend environment variables"
    echo "2. Ensure NEXT_PUBLIC_API_URL is set to: ${BACKEND_API_URL}"
    echo "3. Redeploy frontend after adding the variable"
    echo ""
    echo "To set the variable:"
    echo "  railway variables --set NEXT_PUBLIC_API_URL=${BACKEND_API_URL}"
else
    echo -e "${RED}✗ One or more services are not responding${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check Railway dashboard for service status"
    echo "2. Review deployment logs for errors"
    echo "3. Verify all environment variables are set"
    echo "4. Check the RAILWAY_ENV_CHECKLIST.md file"
fi
echo ""
