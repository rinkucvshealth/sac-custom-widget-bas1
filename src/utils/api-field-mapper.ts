/**
 * Generic API Field Mapper
 * 
 * Uses the centralized mapping configuration to map field names
 * across different SAP APIs.
 */

import { findFieldMapping, getPrimaryAmountField, getAmountFields } from '../config/field-mappings';

/**
 * Map a field name to the correct API field name for a specific service/entity
 * 
 * @param apiName - The OData service name (e.g., 'API_GLACCOUNTLINEITEM')
 * @param entityName - The entity name (e.g., 'GLAccountLineItem')
 * @param inputField - The field name to map (can be user-friendly, technical, or API name)
 * @returns The correct API field name to use in OData queries
 */
export function mapFieldToAPI(
  apiName: string,
  entityName: string,
  inputField: string
): string {
  const mapped = findFieldMapping(apiName, entityName, inputField);
  
  // If mapping found, use it; otherwise return input as-is
  // (might already be the correct API field name)
  return mapped || inputField;
}

/**
 * Map multiple fields at once
 */
export function mapFieldsToAPI(
  apiName: string,
  entityName: string,
  inputFields: string[]
): string[] {
  return inputFields.map(field => mapFieldToAPI(apiName, entityName, field));
}

/**
 * Check if a field is an amount field (for aggregations)
 */
export function isAmountField(
  apiName: string,
  entityName: string,
  fieldName: string
): boolean {
  const amountFields = getAmountFields(apiName, entityName);
  const normalized = fieldName.toLowerCase();
  
  return amountFields.some(af => af.toLowerCase() === normalized) ||
         normalized.includes('amount') ||
         normalized.includes('value') ||
         normalized.includes('currency');
}

/**
 * Get the primary amount field for aggregations
 */
export function getAPIAmountField(apiName: string, entityName: string): string | null {
  return getPrimaryAmountField(apiName, entityName);
}

/**
 * Map filters for an API query
 * Converts filter objects with user-friendly/technical names to API field names
 */
export function mapFiltersToAPI(
  apiName: string,
  entityName: string,
  filters: Array<{field: string, operator: string, value: string}>
): Array<{field: string, operator: string, value: string}> {
  return filters.map(filter => ({
    ...filter,
    field: mapFieldToAPI(apiName, entityName, filter.field)
  }));
}





