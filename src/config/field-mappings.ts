/**
 * Centralized Field Mapping Configuration
 * 
 * This file contains field mappings for all SAP APIs.
 * Add new API mappings here as you discover them.
 * 
 * Structure:
 * - Each API has its own mapping configuration
 * - Maps can handle: user-friendly → API field, table field → API field
 * - Supports multiple aliases for the same field
 */

export interface FieldMapping {
  // User-friendly names (what users might say)
  userFriendly: string[];
  // Table/technical names (from SAP tables like ACDOCA)
  technicalNames?: string[];
  // OData API field name (what the API expects)
  apiFieldName: string;
  // Description for documentation
  description: string;
}

export interface APIFieldMapping {
  apiName: string;
  entityName: string;
  description: string;
  mappings: FieldMapping[];
}

/**
 * API Field Mappings Configuration
 * 
 * To add a new API:
 * 1. Query the OData service metadata: /sap/opu/odata/sap/{SERVICE}/{ENTITY}?$metadata
 * 2. Identify the actual field names in the response
 * 3. Map common user terms and table field names to API field names
 * 4. Add entry to this configuration
 */
export const API_FIELD_MAPPINGS: APIFieldMapping[] = [
  {
    apiName: 'API_GLACCOUNTLINEITEM',
    entityName: 'GLAccountLineItem',
    description: 'General Ledger Account Line Items (maps to ACDOCA table)',
    mappings: [
      // G/L Account Number
      {
        userFriendly: ['GLAccount', 'AccountNumber', 'Account', 'G/L Account'],
        technicalNames: ['RACCT'],
        apiFieldName: 'GLAccount',
        description: 'G/L Account Number'
      },
      // Fiscal Year
      {
        userFriendly: ['FiscalYear', 'Year', 'Accounting Year'],
        technicalNames: ['GJAHR'],
        apiFieldName: 'FiscalYear',
        description: 'Fiscal Year'
      },
      // Company Code
      {
        userFriendly: ['CompanyCode', 'Company'],
        technicalNames: ['RBUKRS'],
        apiFieldName: 'CompanyCode',
        description: 'Company Code'
      },
      // Ledger
      {
        userFriendly: ['Ledger'],
        technicalNames: ['RLDNR'],
        apiFieldName: 'Ledger',
        description: 'Ledger'
      },
      // Client
      {
        userFriendly: ['Client', 'Mandant'],
        technicalNames: ['RCLNT', 'MANDT'],
        apiFieldName: 'Client',
        description: 'Client/Mandant'
      },
      // Amount in Freely Defined Currency 1 (Primary Amount Field)
      {
        userFriendly: ['Amount', 'AmountInFreeDefinedCurrency1', 'OSL', 'FreeCurrencyAmount'],
        technicalNames: ['OSL'],
        apiFieldName: 'AmountInFreeDefinedCurrency1',
        description: 'Amount in Freely Defined Currency 1'
      },
      // Document Number
      {
        userFriendly: ['DocumentNumber', 'DocumentNum', 'Document'],
        technicalNames: ['BELNR'],
        apiFieldName: 'DocumentNumber',
        description: 'Document Number'
      },
      // Line Item
      {
        userFriendly: ['GLAccountLineItem', 'LineItem', 'Line'],
        technicalNames: ['DOCLN'],
        apiFieldName: 'GLAccountLineItem',
        description: 'G/L Account Line Item Number'
      },
      // Additional fields
      {
        userFriendly: ['ProfitCenter'],
        technicalNames: ['PRCTR'],
        apiFieldName: 'ProfitCenter',
        description: 'Profit Center'
      },
      {
        userFriendly: ['FunctionalArea'],
        technicalNames: ['FAREA'],
        apiFieldName: 'FunctionalArea',
        description: 'Functional Area'
      },
      {
        userFriendly: ['ControllingArea'],
        technicalNames: ['KOKRS'],
        apiFieldName: 'ControllingArea',
        description: 'Controlling Area'
      }
    ]
  },

  // ==========================================
  // Add more API mappings here as needed
  // ==========================================

  // Example: Business Partner API (if needed)
  // {
  //   apiName: 'API_BUSINESS_PARTNER',
  //   entityName: 'A_BusinessPartner',
  //   description: 'Business Partner data',
  //   mappings: [
  //     {
  //       userFriendly: ['BusinessPartner', 'BP', 'Partner'],
  //       technicalNames: ['PARTNER'],
  //       apiFieldName: 'BusinessPartner',
  //       description: 'Business Partner Number'
  //     },
  //     // ... more mappings
  //   ]
  // }
];

/**
 * Get field mappings for a specific API and entity
 * Handles service name aliases (e.g., API_GLACCOUNTLINEITEM_0001 → API_GLACCOUNTLINEITEM)
 */
export function getMappingsForAPI(apiName: string, entityName: string): FieldMapping[] {
  // Normalize service name (handle aliases)
  let normalizedApiName = apiName;
  if (apiName === 'API_GLACCOUNTLINEITEM_0001') {
    normalizedApiName = 'API_GLACCOUNTLINEITEM';
  }
  
  const apiMapping = API_FIELD_MAPPINGS.find(
    m => m.apiName === normalizedApiName && m.entityName === entityName
  );
  return apiMapping?.mappings || [];
}

/**
 * Find mapping for a field name in a specific API
 */
export function findFieldMapping(
  apiName: string,
  entityName: string,
  inputField: string
): string | null {
  const mappings = getMappingsForAPI(apiName, entityName);
  const normalizedInput = inputField.trim().toLowerCase();

  for (const mapping of mappings) {
    // Check user-friendly names
    if (mapping.userFriendly.some(f => f.toLowerCase() === normalizedInput)) {
      return mapping.apiFieldName;
    }
    
    // Check technical names
    if (mapping.technicalNames?.some(t => t.toLowerCase() === normalizedInput)) {
      return mapping.apiFieldName;
    }
    
    // Check if input matches API field name directly
    if (mapping.apiFieldName.toLowerCase() === normalizedInput) {
      return mapping.apiFieldName;
    }
    
    // Partial match on user-friendly
    if (mapping.userFriendly.some(f => normalizedInput.includes(f.toLowerCase()))) {
      return mapping.apiFieldName;
    }
  }

  // If no mapping found, return as-is (might already be correct API field name)
  return inputField;
}

/**
 * Get primary amount field for an API (used in aggregations)
 */
export function getPrimaryAmountField(apiName: string, entityName: string): string | null {
  const mappings = getMappingsForAPI(apiName, entityName);
  
  // Look for amount-related fields (priority order)
  const amountKeywords = ['amount', 'value', 'currency', 'osl', 'sum'];
  
  for (const keyword of amountKeywords) {
    const amountMapping = mappings.find(m =>
      m.userFriendly.some(f => f.toLowerCase().includes(keyword)) ||
      m.apiFieldName.toLowerCase().includes(keyword)
    );
    
    if (amountMapping) {
      return amountMapping.apiFieldName;
    }
  }
  
  return null;
}

/**
 * Get all possible amount field names for an API
 */
export function getAmountFields(apiName: string, entityName: string): string[] {
  const mappings = getMappingsForAPI(apiName, entityName);
  
  return mappings
    .filter(m => {
      const fieldLower = m.apiFieldName.toLowerCase();
      const descLower = m.description.toLowerCase();
      return fieldLower.includes('amount') ||
             fieldLower.includes('currency') ||
             fieldLower.includes('value') ||
             descLower.includes('amount') ||
             descLower.includes('currency');
    })
    .map(m => m.apiFieldName);
}


