#!/bin/bash

# Update CF Environment Variables Script
# Run this script to update environment variables in Cloud Foundry

APP_NAME="fi-retail-sac-custom-widget"

echo "Updating environment variables for $APP_NAME..."

# SAP Connection Settings (from SED120 destination)
cf set-env $APP_NAME SAP_HOST "sapsed.cvshealth.com"
cf set-env $APP_NAME SAP_PORT "401"
cf set-env $APP_NAME SAP_CLIENT "120"
cf set-env $APP_NAME SAP_USERNAME "zcloudcons4"
cf set-env $APP_NAME SAP_PASSWORD "Zcfins4cloudcon@dmin1"

# API Keys (replace with your actual keys)
cf set-env $APP_NAME OPENAI_API_KEY "sk-your-openai-api-key-here"
cf set-env $APP_NAME API_KEY "your-custom-api-key"

echo ""
echo "✅ Environment variables updated!"
echo ""
echo "Next step: Restart the app to apply changes"
echo "Run: cf restart $APP_NAME"
