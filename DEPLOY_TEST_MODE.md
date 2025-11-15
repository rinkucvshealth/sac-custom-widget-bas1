# 🎯 Deploy with Test Mode - Quick Guide

## ✅ What I've Done

I've added **TEST_MODE** to your app so you can test it **WITHOUT Cloud Connector**!

### Changes Made:
1. ✅ Added mock SAP customer data (3 records)
2. ✅ Added TEST_MODE environment variable
3. ✅ Updated manifest.yml with TEST_MODE=true
4. ✅ Built the code (TypeScript → JavaScript)
5. ✅ Created new API endpoints for testing

## 🚀 Deploy Now

Run these commands from your BAS terminal:

```bash
# Navigate to project directory
cd /home/user/projects/sac-custom-widget-bas1

# Deploy to Cloud Foundry
cf push
```

That's it! The app will deploy with TEST_MODE enabled.

## ✨ What You'll See

After deployment:

### 1. Test the Chatbot
**URL**: https://fi-retail-sac-custom-widget.cfapps.us10.hana.ondemand.com/test.html

**Try these queries**:
- "Show me customer data"
- "List all customers"
- "Get business partners"

**Result**: You'll see **3 mock customer records** instead of the Cloud Connector error! 🎉

### 2. Verify Test Mode
Visit: https://fi-retail-sac-custom-widget.cfapps.us10.hana.ondemand.com/api/chat/test-mode

```json
{
  "success": true,
  "testMode": true,
  "message": "Test mode is ENABLED - Using mock data",
  "mockDataRecords": 3
}
```

### 3. See Mock Data
Visit: https://fi-retail-sac-custom-widget.cfapps.us10.hana.ondemand.com/api/chat/mock-data

```json
{
  "success": true,
  "data": [
    {
      "BusinessPartner": "1000001",
      "CustomerName": "ABC Corporation",
      "CityName": "New York",
      "Country": "US",
      ...
    },
    ...
  ]
}
```

## 📊 Mock Data Included

**3 Sample Customers**:
1. ABC Corporation (New York, US)
2. XYZ Industries (Los Angeles, US)
3. Global Tech Solutions (Chicago, US)

**Fields Include**:
- BusinessPartner, Customer
- CustomerName, BusinessPartnerName
- City, Country, PostalCode, StreetName
- CustomerAccountGroup

## 🔄 Switch Between Test and Real Data

### Currently: TEST_MODE = true (Mock Data)

To switch to **real SAP data** (after Cloud Connector is ready):

```bash
# Option 1: Update manifest.yml
# Change line: TEST_MODE: true → TEST_MODE: false
cf push

# Option 2: Use CF CLI
cf set-env fi-retail-sac-custom-widget TEST_MODE "false"
cf restart fi-retail-sac-custom-widget
```

## 🎯 Complete Testing Flow

1. **Deploy**:
   ```bash
   cf push
   ```

2. **Wait for deployment** (~2-3 minutes)

3. **Open test page**:
   https://fi-retail-sac-custom-widget.cfapps.us10.hana.ondemand.com/test.html

4. **Type query**: "Show me customer data"

5. **See results**: 3 mock customer records!

6. **Success!** No more Cloud Connector errors! ✅

## 📝 What Changed in Your Code

### manifest.yml
```yaml
env:
  TEST_MODE: true  # ← NEW: Enables mock data
  ...
```

### src/routes/chat.ts
- Added `TEST_MODE` flag
- Added `MOCK_CUSTOMER_DATA` array
- Added `/api/chat/test-mode` endpoint
- Added `/api/chat/mock-data` endpoint
- Modified query endpoint to use mock data when TEST_MODE=true

## ✅ Benefits

- ✨ **Test immediately** - No waiting for Cloud Connector
- 🎯 **See working chatbot** - With realistic SAP-like data
- 🚀 **Demo ready** - Show stakeholders how it works
- 🔧 **Easy switch** - Toggle between mock and real data anytime

## 🔍 Troubleshooting

### If you still see Cloud Connector error:
```bash
# Check environment variables
cf env fi-retail-sac-custom-widget

# Should see: TEST_MODE: true

# If not, set it manually:
cf set-env fi-retail-sac-custom-widget TEST_MODE "true"
cf restart fi-retail-sac-custom-widget
```

### Check logs:
```bash
cf logs fi-retail-sac-custom-widget --recent

# Should see: "TEST_MODE enabled - using mock data instead of SAP"
```

## 📞 Next Steps

1. ✅ Run `cf push` from BAS terminal
2. ✅ Open test page and try queries
3. ✅ See mock customer data
4. ✅ Share with your team!
5. ⏳ When Cloud Connector is ready, switch TEST_MODE to false

---

**Ready to test? Run `cf push` now!** 🚀
