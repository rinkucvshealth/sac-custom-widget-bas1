# Cloud Foundry Crash - Root Cause and Fix

## What Caused the Crash

Your app crashed with state `0/1` because of **TWO critical issues**:

### Issue 1: Missing Compiled Code
- The `dist/` folder (compiled TypeScript files) was in `.gitignore`
- When you ran `cf push`, it deployed the source code but not the compiled JavaScript
- The start command `npm start` tries to run `node dist/server.js`, which didn't exist
- **Result**: App crashed immediately on startup

### Issue 2: Missing Environment Variables
Your `src/config.ts` validates these required environment variables on startup:
- `SAP_HOST`
- `SAP_PORT`
- `SAP_CLIENT`
- `SAP_USERNAME`
- `SAP_PASSWORD`
- `OPENAI_API_KEY`
- `API_KEY`

Your `manifest.yml` only had:
- `NODE_ENV`
- `NPM_CONFIG_PRODUCTION`
- `ALLOWED_ORIGIN`
- `CLOUD_CONNECTOR_LOCATION_ID`

**Result**: Even if the code existed, the app would crash when `validateConfig()` throws an error for missing variables.

## What Was Fixed

### ✅ Fix 1: Auto-build on Deployment
Added `postinstall` script to `package.json`:
```json
"postinstall": "npm run build"
```

This runs automatically during `cf push` after `npm install`, ensuring the TypeScript is compiled to the `dist/` folder.

### ✅ Fix 2: Added Missing Environment Variables
Updated `manifest.yml` with placeholders for all required variables:
```yaml
env:
  # ... existing vars ...
  SAP_HOST: <YOUR_SAP_HOST>
  SAP_PORT: <YOUR_SAP_PORT>
  SAP_CLIENT: <YOUR_SAP_CLIENT>
  SAP_USERNAME: <YOUR_SAP_USERNAME>
  SAP_PASSWORD: <YOUR_SAP_PASSWORD>
  OPENAI_API_KEY: <YOUR_OPENAI_API_KEY>
  API_KEY: <YOUR_API_KEY>
```

## Next Steps

### Option 1: Update manifest.yml (Quick)
Replace the placeholders in `manifest.yml` with your actual values, then:
```bash
cf push
```

### Option 2: Use CF CLI (More Secure - Recommended)
Keep placeholders in manifest.yml and set via CLI:
```bash
cf set-env fi-retail-sac-custom-widget SAP_HOST "your-actual-host"
cf set-env fi-retail-sac-custom-widget SAP_PORT "44300"
cf set-env fi-retail-sac-custom-widget SAP_CLIENT "100"
cf set-env fi-retail-sac-custom-widget SAP_USERNAME "your-username"
cf set-env fi-retail-sac-custom-widget SAP_PASSWORD "your-password"
cf set-env fi-retail-sac-custom-widget OPENAI_API_KEY "sk-..."
cf set-env fi-retail-sac-custom-widget API_KEY "your-api-key"

cf push
```

## Verify the Fix

After deployment, check:
```bash
cf logs fi-retail-sac-custom-widget --recent
```

You should see:
```
SAC Custom Widget server running on port 8080
Environment: qa
```

And the app should be in `running` state:
```bash
cf app fi-retail-sac-custom-widget
```

Test the endpoints:
- https://fi-retail-sac-custom-widget.cfapps.us10.hana.ondemand.com/health
- https://fi-retail-sac-custom-widget.cfapps.us10.hana.ondemand.com/

## Deployment Status: ✅ RESOLVED

The app crash has been **completely fixed**! Your app is now running successfully:

```
✅ SAC Custom Widget server running on port 8080
✅ Container became healthy  
✅ Widget files loading successfully
✅ API endpoints accessible
```

## New Issue Discovered

Now that the app is running, you have a **different issue** - SAP Cloud Connector configuration:

**Error**: 503 - "There is no SAP Cloud Connector (SCC) connected to your subaccount"

This is NOT a deployment crash - it's a connectivity configuration issue. The app works fine, but needs Cloud Connector setup to connect to your on-premise SAP system.

📖 **See `CLOUD_CONNECTOR_SETUP.md` for detailed instructions on how to fix this.**

## Files Modified
- ✅ `package.json` - Added postinstall script
- ✅ `manifest.yml` - Added required environment variables
- ℹ️ `DEPLOYMENT.md` - Detailed deployment guide created
- ℹ️ `CRASH_FIX.md` - This file
- ℹ️ `CLOUD_CONNECTOR_SETUP.md` - Cloud Connector configuration guide
