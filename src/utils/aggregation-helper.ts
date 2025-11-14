/**
 * Aggregation Helper Utilities
 * Provides optimized aggregation functions for large datasets
 */

/**
 * Sum values from an array of records for a specific field
 * Handles numeric parsing and null/undefined values safely
 */
export function sumField(
  records: any[], 
  fieldName: string, 
  precision: number = 2
): number {
  if (!records || records.length === 0) {
    return 0;
  }

  const sum = records.reduce((total, record) => {
    const value = record[fieldName];
    
    // Handle null, undefined, empty string
    if (value === null || value === undefined || value === '') {
      return total;
    }
    
    // Parse numeric value
    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
    
    // Skip NaN values
    if (isNaN(numValue)) {
      return total;
    }
    
    return total + numValue;
  }, 0);

  // Round to specified precision to match SAP behavior
  return Math.round(sum * Math.pow(10, precision)) / Math.pow(10, precision);
}

/**
 * Check if all records have been fetched (for pagination)
 * Returns true if we might have more records than fetched
 */
export function mightHaveMoreRecords(
  fetchedCount: number, 
  requestedLimit: number
): boolean {
  // If we fetched exactly the limit, there might be more records
  return fetchedCount >= requestedLimit;
}

/**
 * Calculate aggregation result with proper precision matching SAP
 */
export function calculateAggregation(
  records: any[],
  fieldName: string,
  aggregationType: 'sum' | 'count' | 'avg' | 'max' | 'min',
  precision: number = 2
): number {
  if (!records || records.length === 0) {
    return aggregationType === 'count' ? 0 : 0;
  }

  switch (aggregationType) {
    case 'sum':
      return sumField(records, fieldName, precision);
    
    case 'count':
      return records.length;
    
    case 'avg': {
      const sum = sumField(records, fieldName, precision);
      return records.length > 0 
        ? Math.round((sum / records.length) * Math.pow(10, precision)) / Math.pow(10, precision)
        : 0;
    }
    
    case 'max': {
      const values = records
        .map(r => {
          const val = r[fieldName];
          return typeof val === 'number' ? val : parseFloat(String(val || 0));
        })
        .filter(v => !isNaN(v));
      return values.length > 0 ? Math.max(...values) : 0;
    }
    
    case 'min': {
      const values = records
        .map(r => {
          const val = r[fieldName];
          return typeof val === 'number' ? val : parseFloat(String(val || 0));
        })
        .filter(v => !isNaN(v));
      return values.length > 0 ? Math.min(...values) : 0;
    }
    
    default:
      return 0;
  }
}





