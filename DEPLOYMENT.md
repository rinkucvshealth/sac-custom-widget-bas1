# Cloud Foundry Deployment Guide

## Issues Fixed

### 1. Missing Build Step
- **Problem**: The `dist/` folder (compiled TypeScript) wasn't being deployed
- **Solution**: Added `postinstall` script to automatically build during CF deployment

### 2. Missing Environment Variables
- **Problem**: The app requires several environment variables that weren't configured
- **Solution**: Updated `manifest.yml` with all required variables (you need to fill in values)

## Required Configuration

Before deploying, update the following environment variables in `manifest.yml`:

### SAP Connection Details
```yaml
SAP_HOST: <YOUR_SAP_HOST>          # e.g., sapserver.company.com
SAP_PORT: <YOUR_SAP_PORT>          # e.g., 44300 or 443
SAP_CLIENT: <YOUR_SAP_CLIENT>      # e.g., 100
SAP_USERNAME: <YOUR_SAP_USERNAME>  # SAP service account username
SAP_PASSWORD: <YOUR_SAP_PASSWORD>  # SAP service account password
```

### API Keys
```yaml
OPENAI_API_KEY: <YOUR_OPENAI_API_KEY>  # OpenAI API key for chatbot
API_KEY: <YOUR_API_KEY>                # Your custom API key for authentication
```

## Deployment Steps

1. **Update manifest.yml** with your actual values:
   ```bash
   vi manifest.yml
   ```

2. **Deploy to Cloud Foundry**:
   ```bash
   cf login
   cf push
   ```

3. **Verify deployment**:
   ```bash
   cf logs fi-retail-sac-custom-widget --recent
   cf apps
   ```

## Alternative: Set Environment Variables via CF CLI

Instead of putting sensitive data in `manifest.yml`, you can set them via CLI:

```bash
# Set environment variables
cf set-env fi-retail-sac-custom-widget SAP_HOST "your-sap-host"
cf set-env fi-retail-sac-custom-widget SAP_PORT "44300"
cf set-env fi-retail-sac-custom-widget SAP_CLIENT "100"
cf set-env fi-retail-sac-custom-widget SAP_USERNAME "your-username"
cf set-env fi-retail-sac-custom-widget SAP_PASSWORD "your-password"
cf set-env fi-retail-sac-custom-widget OPENAI_API_KEY "sk-..."
cf set-env fi-retail-sac-custom-widget API_KEY "your-api-key"

# Restart the app
cf restart fi-retail-sac-custom-widget
```

## Verify App is Running

Once deployed, check:

1. **Health endpoint**: https://fi-retail-sac-custom-widget.cfapps.us10.hana.ondemand.com/health
2. **Root endpoint**: https://fi-retail-sac-custom-widget.cfapps.us10.hana.ondemand.com/
3. **Widget JSON**: https://fi-retail-sac-custom-widget.cfapps.us10.hana.ondemand.com/widget/widget-rinku.json

## Troubleshooting

If the app still crashes:

1. Check logs:
   ```bash
   cf logs fi-retail-sac-custom-widget --recent
   ```

2. Verify environment variables are set:
   ```bash
   cf env fi-retail-sac-custom-widget
   ```

3. Check app status:
   ```bash
   cf app fi-retail-sac-custom-widget
   ```

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit sensitive credentials to git
- Use CF CLI to set environment variables for production
- Consider using SAP BTP services for credential management
- The placeholders in manifest.yml should be replaced before deployment
