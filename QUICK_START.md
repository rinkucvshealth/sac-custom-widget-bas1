# Quick Start Guide

## ✅ YOUR APP IS RUNNING!

**URL**: https://fi-retail-sac-custom-widget.cfapps.us10.hana.ondemand.com/

The deployment crash has been fixed. Your app started successfully and is healthy.

---

## 🎯 What You Need To Do Now

### The Issue
Your app can't connect to SAP because **Cloud Connector is not configured** for your new subaccount.

### The Fix
You need to configure SAP Cloud Connector with:
- **Subaccount ID**: `ca36f8c6-f658-4bc2-834e-f521d02d7236`
- **Location ID**: `SAP_DI_Test`
- **Target**: `sapsed.cvshealth.com:401`

### Quick Steps:

**If you have Cloud Connector access:**
1. Open Cloud Connector admin UI
2. Add subaccount `ca36f8c6-f658-4bc2-834e-f521d02d7236`
3. Set location ID to `SAP_DI_Test`
4. Verify connection is green

**If you don't have access:**
- Contact your **SAP Basis team** or **BTP Administrator**
- Share the `CLOUD_CONNECTOR_SETUP.md` file with them
- They can configure it in 5-10 minutes

---

## 📖 Full Documentation

| Document | When to Use |
|----------|-------------|
| `STATUS.md` | See current status and what was fixed |
| `CLOUD_CONNECTOR_SETUP.md` | Configure Cloud Connector (detailed steps) |
| `CRASH_FIX.md` | Understand what caused the original crash |
| `DEPLOYMENT.md` | Deploy to other environments |

---

## 🧪 Test Your App

After Cloud Connector is configured:

1. **Open**: https://fi-retail-sac-custom-widget.cfapps.us10.hana.ondemand.com/test.html
2. **Type**: "hello" or "show customers"
3. **Expect**: Data from SAP (not 503 error)

---

## ⚡ Commands

```bash
# View logs
cf logs fi-retail-sac-custom-widget --recent

# Check app status
cf app fi-retail-sac-custom-widget

# Restart if needed
cf restart fi-retail-sac-custom-widget
```
