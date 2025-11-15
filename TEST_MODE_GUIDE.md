# Test Mode Guide - Testing Without Cloud Connector

## Overview

I've added a **TEST_MODE** feature that allows you to test your chatbot widget with mock SAP data **without needing Cloud Connector**.

## What Was Added

### 1. Mock Data
Added sample customer data that mimics real SAP Business Partner data:
- 3 customer records with realistic fields
- BusinessPartner, Customer, Name, Address, etc.

### 2. Test Mode Environment Variable
- **TEST_MODE=true**: Use mock data (no Cloud Connector needed)
- **TEST_MODE=false** or not set: Use real SAP data (requires Cloud Connector)

### 3. New API Endpoints

#### Check Test Mode Status
```bash
GET https://fi-retail-sac-custom-widget.cfapps.us10.hana.ondemand.com/api/chat/test-mode
```

#### Get Mock Data Directly
```bash
GET https://fi-retail-sac-custom-widget.cfapps.us10.hana.ondemand.com/api/chat/mock-data
```

## How to Use

### Enable Test Mode

#### Option 1: Set Environment Variable via CF CLI
```bash
cf set-env fi-retail-sac-custom-widget TEST_MODE "true"
cf restart fi-retail-sac-custom-widget
```

#### Option 2: Deploy with TEST_MODE Enabled (Already Done)
The manifest.yml already has TEST_MODE set to `true`, so just deploy:
```bash
cf push
```

### Test the Chatbot

1. **Open test page**:
   https://fi-retail-sac-custom-widget.cfapps.us10.hana.ondemand.com/test.html

2. **Type any customer query**:
   - "Show me customer data"
   - "List all customers"
   - "Get business partners"

3. **See mock data results**:
   - You'll see 3 sample customer records
   - Summary will show "(MOCK DATA for testing)"
   - No Cloud Connector errors!

### Check Test Mode Status

Visit:
```
https://fi-retail-sac-custom-widget.cfapps.us10.hana.ondemand.com/api/chat/test-mode
```

Response:
```json
{
  "success": true,
  "testMode": true,
  "message": "Test mode is ENABLED - Using mock data",
  "mockDataRecords": 3
}
```

### Get Mock Data Directly

Visit:
```
https://fi-retail-sac-custom-widget.cfapps.us10.hana.ondemand.com/api/chat/mock-data
```

Response:
```json
{
  "success": true,
  "summary": "Found 3 customer records (MOCK DATA)",
  "data": [
    {
      "BusinessPartner": "1000001",
      "Customer": "1000001",
      "BusinessPartnerName": "ABC Corporation",
      "CustomerName": "ABC Corporation",
      "CityName": "New York",
      "Country": "US",
      ...
    }
  ],
  "recordCount": 3,
  "isMockData": true
}
```

## Deploying with Test Mode

### Current State (TEST_MODE=true)
```bash
cf push
```
The app will use mock data - perfect for testing without Cloud Connector!

### Switch to Real SAP Data (After Cloud Connector is Ready)
```bash
# Option 1: Update manifest.yml
# Change: TEST_MODE: false
cf push

# Option 2: Use CF CLI
cf set-env fi-retail-sac-custom-widget TEST_MODE "false"
cf restart fi-retail-sac-custom-widget
```

## Mock Data Structure

The mock data includes these fields:
- **BusinessPartner**: Business partner number
- **Customer**: Customer number
- **BusinessPartnerName**: Full business name
- **CustomerName**: Customer name
- **OrganizationBPName1**: Short name
- **CityName**: City
- **Country**: Country code
- **PostalCode**: ZIP/Postal code
- **StreetName**: Street address
- **CustomerAccountGroup**: Account group

## Benefits

✅ **Test without Cloud Connector**: No infrastructure setup needed
✅ **See realistic data**: Mock data looks like real SAP data
✅ **Test chatbot functionality**: Verify widget UI, queries, display
✅ **Demo to stakeholders**: Show the chatbot working with sample data
✅ **Develop locally**: Test on your laptop without VPN/SAP access

## Next Steps

1. **Deploy with Test Mode** ✅ (Already configured in manifest.yml)
   ```bash
   cf push
   ```

2. **Test the Chatbot**:
   - Open test page
   - Try queries like "show me customer data"
   - See 3 mock customer records

3. **When Cloud Connector is Ready**:
   - Change TEST_MODE to `false`
   - Redeploy
   - Start getting real SAP data!

## Deployment Commands

```bash
# Deploy with test mode (current setup)
cf push

# Check if it's running
cf app fi-retail-sac-custom-widget

# View logs
cf logs fi-retail-sac-custom-widget --recent

# Verify test mode is enabled
curl https://fi-retail-sac-custom-widget.cfapps.us10.hana.ondemand.com/api/chat/test-mode
```

## Important Notes

- 🧪 **Test Mode is for testing only** - Don't use in production
- 🔄 **Switch modes easily** - Just change TEST_MODE environment variable
- 📊 **Same user experience** - Widget works identically with mock or real data
- ⚡ **Fast testing** - No waiting for Cloud Connector setup

