# SAP Cloud Connector Setup for New Subaccount

## Current Issue

Your app is running successfully but cannot connect to the on-premise SAP system because the SAP Cloud Connector (SCC) is not configured for your new subaccount.

**Error**: "There is no SAP Cloud Connector (SCC) connected to your subaccount"

**Subaccount ID**: `ca36f8c6-f658-4bc2-834e-f521d02d7236`

**Required Location ID**: `SAP_DI_Test`

**Destination**: `SED120` → `http://sapsed.cvshealth.com:401`

## Solution Options

### Option 1: Configure Existing Cloud Connector for New Subaccount

If you have an existing Cloud Connector running with location ID `SAP_DI_Test`, add the new subaccount to it:

1. **Open Cloud Connector Admin UI**:
   - Typically at: `https://localhost:8443` or your SCC server
   - Login with your administrator credentials

2. **Add New Subaccount**:
   - Click the **"+"** button next to subaccounts
   - Enter the following details:
     - **Region**: `cf.us10.hana.ondemand.com` (or your BTP region)
     - **Subaccount ID**: `ca36f8c6-f658-4bc2-834e-f521d02d7236`
     - **Display Name**: `cvs_ret_sapai` or any meaningful name
     - **Login Email**: Your BTP user email
     - **Password**: Your BTP password
     - **Location ID**: `SAP_DI_Test`

3. **Verify Connection**:
   - Status should show "Connected" with a green indicator
   - Check "Cloud To On-Premise" section shows your subaccount

4. **Configure Access Control (if not already done)**:
   - Go to "Cloud To On-Premise" → "Access Control"
   - Add mapping:
     - **Backend Type**: SAP ABAP System
     - **Protocol**: HTTP
     - **Internal Host**: `sapsed.cvshealth.com`
     - **Internal Port**: `401`
     - **Virtual Host**: `sapsed.cvshealth.com`
     - **Virtual Port**: `401`
     - **Principal Type**: None (or as per your security policy)

### Option 2: Install New Cloud Connector (If Needed)

If you don't have a Cloud Connector with location ID `SAP_DI_Test`:

1. **Download & Install SAP Cloud Connector**:
   ```bash
   # Download from SAP Software Center
   # Install following: https://help.sap.com/docs/CP_CONNECTIVITY/cca91383641e40ffbe03bdc78f00f681/57ae3d62f63440f7952e57bfcef948d3.html
   ```

2. **Configure Initial Setup**:
   - Set administrator password
   - Configure system certificate
   - Set up proxy settings (if behind corporate proxy)

3. **Connect to BTP Subaccount** (follow Option 1, step 2)

4. **Set Location ID**: `SAP_DI_Test`

### Option 3: Update Destination to Use Different Location ID

If you have a Cloud Connector with a different location ID already configured:

1. **Check your existing Cloud Connector**:
   ```bash
   # In Cloud Connector UI, check the Location ID
   ```

2. **Update the Destination in BTP**:
   - Go to BTP Cockpit → Connectivity → Destinations
   - Edit destination: `SED120`
   - Update property: `CloudConnectorLocationId` = `<your-actual-location-id>`
   - Or remove it to use default (empty string)

3. **Restart your app**:
   ```bash
   cf restart fi-retail-sac-custom-widget
   ```

### Option 4: Use Different Destination (if available)

If you have another destination already configured for this subaccount:

1. **Check available destinations**:
   - BTP Cockpit → Connectivity → Destinations
   - Look for destinations pointing to your SAP system

2. **Update your app configuration** to use the correct destination name

## Verification Steps

After configuring the Cloud Connector:

1. **Check SCC Status**:
   - Open Cloud Connector Admin UI
   - Verify subaccount shows "Connected" (green)
   - Check tunnel count shows active connections

2. **Test from BTP Cockpit**:
   - Go to Connectivity → Destinations
   - Click on `SED120` destination
   - Click "Check Connection" button
   - Should show "200 OK"

3. **Test Your App**:
   - Open: https://fi-retail-sac-custom-widget.cfapps.us10.hana.ondemand.com/test.html
   - Try a query in the chatbot
   - Check logs:
     ```bash
     cf logs fi-retail-sac-custom-widget --recent
     ```
   - Should NOT see the 503 error anymore

4. **View Real-time Logs**:
   ```bash
   cf logs fi-retail-sac-custom-widget
   ```
   - Make a query through the widget
   - Watch for successful OData responses

## Troubleshooting

### Issue: "Location ID mismatch"
**Solution**: Ensure the Location ID in Cloud Connector matches exactly what's in your destination (`SAP_DI_Test`)

### Issue: "502 Bad Gateway" 
**Solution**: 
- Check Cloud Connector is running
- Verify network connectivity from SCC to SAP system
- Check firewall rules allow traffic

### Issue: "401 Unauthorized"
**Solution**: Verify the credentials in the destination are correct

### Issue: "Cannot reach subaccount"
**Solution**: 
- Check SCC can reach the internet
- Verify proxy settings in SCC (if behind corporate proxy)
- Check BTP region is correct

## Important Notes

- 🔐 **Security**: Cloud Connector requires proper network security configuration
- 🔄 **High Availability**: For production, set up redundant Cloud Connectors
- 📊 **Monitoring**: Regularly check Cloud Connector health and logs
- 🔧 **Maintenance**: Keep Cloud Connector updated to latest version

## Quick Reference

**Your Subaccount Details**:
- Org: `CVS_sap_ai`
- Space: `cvs_ret_sapai`
- Subaccount ID: `ca36f8c6-f658-4bc2-834e-f521d02d7236`
- Region: `cf.us10.hana.ondemand.com`
- Location ID: `SAP_DI_Test`

**Your Destination Details**:
- Name: `SED120`
- Target: `http://sapsed.cvshealth.com:401`
- Client: `120`
- User: `zcloudcons4`
- Type: OnPremise (requires Cloud Connector)

## Next Steps

1. ✅ **App Deployment**: COMPLETE (app is running)
2. 🔧 **Cloud Connector**: Configure using one of the options above
3. ✅ **Test Connectivity**: Verify end-to-end connection
4. 🚀 **Go Live**: Your app will be fully functional

## Resources

- [SAP Cloud Connector Documentation](https://help.sap.com/docs/CP_CONNECTIVITY/cca91383641e40ffbe03bdc78f00f681/e6c7616abb5710148cfcf3e75d96d596.html)
- [Configure Access Control](https://help.sap.com/docs/CP_CONNECTIVITY/cca91383641e40ffbe03bdc78f00f681/e7d4927dbb571014af7ef6ebd6cc3511.html)
- [BTP Destinations](https://help.sap.com/docs/CP_CONNECTIVITY/cca91383641e40ffbe03bdc78f00f681/e4f1d97cbb571014a247d10f9f9a685d.html)
