/**
 * GL Account Field Mapper
 * Maps user-friendly field names to OData API field names for GLAccountLineItem
 * NOTE: OData API field names differ from ACDOCA table technical names
 */

export interface GLAccountFieldMapping {
  userFriendly: string;
  technicalName: string;
  odataName: string;  // OData API field name (different from table technical name)
  description: string;
}

/**
 * Field mappings for GL Account Line Item
 * 
 * IMPORTANT: OData API uses different field names than ACDOCA table
 * 
 * Mapping Reference:
 * | ACDOCA Table Field | OData API Field                    |
 * |-------------------|------------------------------------|
 * | RACCT             | GLAccount                         |
 * | GJAHR             | FiscalYear                        |
 * | RBUKRS            | CompanyCode                       |
 * | RLDNR             | Ledger                            |
 * | OSL               | AmountInFreeDefinedCurrency1       |
 */
export const GL_ACCOUNT_FIELD_MAPPINGS: GLAccountFieldMapping[] = [
  // ============================================
  // PRIMARY MAPPINGS - ACDOCA to OData API
  // ============================================
  
  // RACCT → GLAccount
  { userFriendly: 'AccountNumber', technicalName: 'RACCT', odataName: 'GLAccount', description: 'G/L Account Number' },
  { userFriendly: 'GLAccount', technicalName: 'RACCT', odataName: 'GLAccount', description: 'G/L Account Number' },
  { userFriendly: 'RACCT', technicalName: 'RACCT', odataName: 'GLAccount', description: 'G/L Account Number (ACDOCA name)' },
  
  // GJAHR → FiscalYear
  { userFriendly: 'FiscalYear', technicalName: 'GJAHR', odataName: 'FiscalYear', description: 'Fiscal Year' },
  { userFriendly: 'Year', technicalName: 'GJAHR', odataName: 'FiscalYear', description: 'Fiscal Year' },
  { userFriendly: 'GJAHR', technicalName: 'GJAHR', odataName: 'FiscalYear', description: 'Fiscal Year (ACDOCA name)' },
  
  // RBUKRS → CompanyCode
  { userFriendly: 'CompanyCode', technicalName: 'RBUKRS', odataName: 'CompanyCode', description: 'Company Code' },
  { userFriendly: 'RBUKRS', technicalName: 'RBUKRS', odataName: 'CompanyCode', description: 'Company Code (ACDOCA name)' },
  
  // RLDNR → Ledger
  { userFriendly: 'Ledger', technicalName: 'RLDNR', odataName: 'Ledger', description: 'Ledger' },
  { userFriendly: 'RLDNR', technicalName: 'RLDNR', odataName: 'Ledger', description: 'Ledger (ACDOCA name)' },
  
  // OSL → AmountInFreeDefinedCurrency1
  { userFriendly: 'OSL', technicalName: 'OSL', odataName: 'AmountInFreeDefinedCurrency1', description: 'Amount in Freely Defined Currency 1 (ACDOCA name)' },
  { userFriendly: 'AmountInFreeDefinedCurrency1', technicalName: 'OSL', odataName: 'AmountInFreeDefinedCurrency1', description: 'Amount in Freely Defined Currency 1' },
  { userFriendly: 'Amount', technicalName: 'OSL', odataName: 'AmountInFreeDefinedCurrency1', description: 'Amount in Freely Defined Currency 1 (default)' },
  
  // ============================================
  // ADDITIONAL FIELDS
  // ============================================
  
  // Client (may use same name in both)
  { userFriendly: 'Client', technicalName: 'RCLNT', odataName: 'Client', description: 'Client/Mandant' },
  { userFriendly: 'RCLNT', technicalName: 'RCLNT', odataName: 'Client', description: 'Client/Mandant (ACDOCA name)' },
  
  // Document fields
  { userFriendly: 'DocumentNumber', technicalName: 'BELNR', odataName: 'DocumentNumber', description: 'Document Number' },
  { userFriendly: 'DocumentNum', technicalName: 'BELNR', odataName: 'DocumentNumber', description: 'Document Number' },
  { userFriendly: 'BELNR', technicalName: 'BELNR', odataName: 'DocumentNumber', description: 'Document Number (ACDOCA name)' },
  
  // Line Item fields
  { userFriendly: 'GLAccountLineItem', technicalName: 'DOCLN', odataName: 'GLAccountLineItem', description: 'G/L Account Line Item' },
  { userFriendly: 'LineItem', technicalName: 'DOCLN', odataName: 'GLAccountLineItem', description: 'G/L Account Line Item' },
  { userFriendly: 'DOCLN', technicalName: 'DOCLN', odataName: 'GLAccountLineItem', description: 'G/L Account Line Item (ACDOCA name)' },
  
  // Other common fields (assuming same names)
  { userFriendly: 'ProfitCenter', technicalName: 'PRCTR', odataName: 'ProfitCenter', description: 'Profit Center' },
  { userFriendly: 'FunctionalArea', technicalName: 'FAREA', odataName: 'FunctionalArea', description: 'Functional Area' },
  { userFriendly: 'ControllingArea', technicalName: 'KOKRS', odataName: 'ControllingArea', description: 'Controlling Area' },
];

/**
 * Map user-friendly field name to OData API field name
 * For OData queries, we use odataName (not technicalName from ACDOCA table)
 */
export function mapGLAccountField(userField: string, useODataName: boolean = true): string {
  const normalizedField = userField.trim();
  
  // Direct match first
  const directMatch = GL_ACCOUNT_FIELD_MAPPINGS.find(
    m => m.userFriendly.toLowerCase() === normalizedField.toLowerCase() ||
         m.technicalName.toLowerCase() === normalizedField.toLowerCase() ||
         (useODataName && m.odataName.toLowerCase() === normalizedField.toLowerCase())
  );
  
  if (directMatch) {
    // Return OData field name for API queries, technical name for table queries
    return useODataName ? directMatch.odataName : directMatch.technicalName;
  }
  
  // Partial match for common variations
  const partialMatch = GL_ACCOUNT_FIELD_MAPPINGS.find(
    m => normalizedField.toLowerCase().includes(m.userFriendly.toLowerCase()) ||
         normalizedField.toLowerCase().includes(m.technicalName.toLowerCase()) ||
         (useODataName && normalizedField.toLowerCase().includes(m.odataName.toLowerCase()))
  );
  
  if (partialMatch) {
    return useODataName ? partialMatch.odataName : partialMatch.technicalName;
  }
  
  // Return as-is if no mapping found (might already be OData field name)
  return normalizedField;
}

/**
 * Map multiple fields at once
 */
export function mapGLAccountFields(fields: string[], useODataName: boolean = true): string[] {
  return fields.map(field => mapGLAccountField(field, useODataName));
}

/**
 * Check if a field is an amount field for aggregation
 */
export function isAmountField(fieldName: string): boolean {
  const normalized = fieldName.toLowerCase();
  const amountFields = ['osl', 'amountinfreedefinedcurrency1', 'amount'];
  return amountFields.some(af => normalized.includes(af));
}

/**
 * Get the primary amount field name
 * Returns OData API field name, not table technical name
 */
export function getPrimaryAmountField(useODataName: boolean = true): string {
  if (useODataName) {
    return 'AmountInFreeDefinedCurrency1'; // OData API field name
  }
  return 'OSL'; // ACDOCA table technical name
}

/**
 * Get all possible amount field names in priority order
 * Returns OData API field names
 */
export function getAmountFieldNames(useODataName: boolean = true): string[] {
  if (useODataName) {
    // OData API field names
    return ['AmountInFreeDefinedCurrency1', 'AmountInLocalCurrency', 
            'AmountInDocumentCurrency', 'AmountInCompanyCodeCurrency', 
            'Amount', 'OSL'];
  }
  // ACDOCA table technical names
  return ['OSL', 'AmountInFreeDefinedCurrency1', 'AmountInLocalCurrency', 
          'AmountInDocumentCurrency', 'AmountInCompanyCodeCurrency', 'Amount'];
}

