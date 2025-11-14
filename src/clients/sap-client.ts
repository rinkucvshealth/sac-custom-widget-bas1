import axios from 'axios';
import { config, SAP_ODATA_BASE_URL } from '../config';
import { logger } from '../utils/logger';
import { SAPError, EntityProperty, EntityMetadata, ServiceMetadata, FoundEntity } from '../types';
import { SERVICE_WHITELIST, KNOWN_ENTITIES, PARAMETER_BASED_APIS, ENTITY_SYNONYMS } from '../constants';
import { serviceMetadataCache, entityDataCache } from '../utils/cache';
import { DestinationService } from './destination-client';

/**
 * Get test endpoints for a service to try for metadata
 */
function _getTestEndpointsForService(serviceName: string): Array<{path: string, entity: string}> {
    const endpoints: Array<{path: string, entity: string}> = [];
    
    switch (serviceName) {
        case 'API_BUSINESS_PARTNER':
            endpoints.push(
                { path: '/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner', entity: 'A_BusinessPartner' },
                { path: '/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_Customer', entity: 'A_Customer' },
                { path: '/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartnerAddress', entity: 'A_BusinessPartnerAddress' }
            );
            break;
            
        case 'API_GLACCOUNTLINEITEM':
            endpoints.push(
                { path: '/sap/opu/odata/sap/API_GLACCOUNTLINEITEM/GLAccountLineItem', entity: 'GLAccountLineItem' }
            );
            break;
            
        case 'API_MATERIAL_DOCUMENT_SRV':
            endpoints.push(
                { path: '/sap/opu/odata/sap/API_MATERIAL_DOCUMENT_SRV/A_MaterialDocumentItem', entity: 'A_MaterialDocumentItem' }
            );
            break;
            
        case 'API_CUSTOMER_MATERIAL_SRV':
            endpoints.push(
                { path: '/sap/opu/odata/sap/API_CUSTOMER_MATERIAL_SRV/A_CustomerMaterial', entity: 'A_CustomerMaterial' }
            );
            break;
            
        case 'MMIM_MATERIAL_DATA_SRV':
            endpoints.push(
                { path: '/sap/opu/odata/sap/MMIM_MATERIAL_DATA_SRV/I_InvtryMgmtMatlMstrVH', entity: 'I_InvtryMgmtMatlMstrVH' },
                { path: '/sap/opu/odata/sap/MMIM_MATERIAL_DATA_SRV/I_InvtryMgmtSuplrInfoRecdVH', entity: 'I_InvtryMgmtSuplrInfoRecdVH' }
            );
            break;
            
        case 'API_CUSTOMER_RETURNS_DELIVERY_SRV':
            endpoints.push(
                { path: '/sap/opu/odata/sap/API_CUSTOMER_RETURNS_DELIVERY_SRV/A_ReturnsDeliveryItem', entity: 'A_ReturnsDeliveryItem' }
            );
            break;
            
        default:
            // Generic fallback - try common entity names
            endpoints.push(
                { path: `/sap/opu/odata/sap/${serviceName}/A_BusinessPartner`, entity: 'A_BusinessPartner' },
                { path: `/sap/opu/odata/sap/${serviceName}/A_Customer`, entity: 'A_Customer' },
                { path: `/sap/opu/odata/sap/${serviceName}/GLAccountLineItem`, entity: 'GLAccountLineItem' }
            );
    }
    
    return endpoints;
}

/**
 * Get metadata for a service
 */
export async function getServiceMetadata(serviceName: string): Promise<ServiceMetadata> {
    const cacheKey = `metadata_${serviceName}`;
    
    // Check cache first
    if (serviceMetadataCache.has(cacheKey)) {
        logger.debug(`Using cached metadata for ${serviceName}`);
        return serviceMetadataCache.get(cacheKey)!;
    }

    try {
        logger.debug(`Fetching metadata for service: ${serviceName}`);
        
        // Use destination service if available
        const destinationService = new DestinationService();
        const destination = await destinationService.getDestination('SED120');
        
        if (!destination) {
            throw new Error('Could not get destination configuration');
        }

        const client = await destinationService.createAxiosClient(destination);
        
        // Try different endpoints based on the service name
        const testEndpoints = _getTestEndpointsForService(serviceName);
        
        for (const endpoint of testEndpoints) {
            try {
                logger.debug(`Trying metadata endpoint: ${endpoint.path}`);
                const response = await client.get(endpoint.path, {
                    headers: { 'Accept': 'application/json' },
                    timeout: 10000
                });
                
                // Create mock metadata from the response
                const responseData = response.data.value || response.data.d?.results || [];
                const sampleRecord = Array.isArray(responseData) && responseData.length > 0 ? responseData[0] : {};
                
                const metadata: ServiceMetadata = {
                    serviceName: serviceName,
                    entitySets: [
                        {
                            name: endpoint.entity,
                            properties: Object.keys(sampleRecord).map(key => ({
                                name: key,
                                type: 'string'
                            }))
                        }
                    ]
                };
                
                // Cache the metadata
                serviceMetadataCache.set(cacheKey, metadata);
                logger.debug(`Successfully fetched metadata for ${serviceName} using ${endpoint.entity}`);
                return metadata;
                
            } catch (endpointError: any) {
                logger.warn(`${endpoint.entity} endpoint failed:`, endpointError.message);
                continue; // Try next endpoint
            }
        }
        
        throw new SAPError(`Could not fetch metadata for ${serviceName} - all endpoints failed.`);
        
    } catch (error: any) {
        logger.error(`Error getting metadata for ${serviceName}:`, error.message);
        throw new SAPError(`Could not fetch metadata for ${serviceName}.`);
    }
}

/**
 * Simple entity finder that works with known entities
 */
export async function findServiceForEntity(entityNameToFind: string, filters?: { [key: string]: string }): Promise<FoundEntity[]> {
    logger.debug(`Starting entity search for: "${entityNameToFind}"`);
    
    const cleanInput = entityNameToFind.replace(/\s/g, '').toLowerCase();
    
    // Check synonyms first
    for (const [synonymKey, synonyms] of Object.entries(ENTITY_SYNONYMS)) {
        if (synonyms.some(synonym => cleanInput.includes(synonym.toLowerCase()))) {
            logger.debug(`Found synonym match: ${synonymKey} for input: ${entityNameToFind}`);
            
            // Map synonyms to actual entities
            switch (synonymKey) {
                case 'materialdocument':
                    return [{
                        serviceName: 'API_MATERIAL_DOCUMENT_SRV',
                        entityName: 'A_MaterialDocumentItem',
                        serviceTitle: 'API_MATERIAL_DOCUMENT_SRV'
                    }];
                case 'customermaterial':
                    return [{
                        serviceName: 'API_CUSTOMER_MATERIAL_SRV',
                        entityName: 'A_CustomerMaterial',
                        serviceTitle: 'API_CUSTOMER_MATERIAL_SRV'
                    }];
                case 'materialmaster':
                    return [{
                        serviceName: 'MMIM_MATERIAL_DATA_SRV',
                        entityName: 'I_InvtryMgmtMatlMstrVH',
                        serviceTitle: 'MMIM_MATERIAL_DATA_SRV'
                    }];
                case 'supplierinfo':
                    return [{
                        serviceName: 'MMIM_MATERIAL_DATA_SRV',
                        entityName: 'I_InvtryMgmtSuplrInfoRecdVH',
                        serviceTitle: 'MMIM_MATERIAL_DATA_SRV'
                    }];
            }
        }
    }
    
    // Check if it's a customer/business partner query
    if (cleanInput.includes('customer') || 
        cleanInput.includes('business') || 
        cleanInput.includes('partner')) {
        
        logger.debug('Found customer/business partner query, trying multiple entities');
        
        // Try multiple entities to see which one has data
        return [
            {
                serviceName: 'API_BUSINESS_PARTNER',
                entityName: 'A_BusinessPartner',
                serviceTitle: 'API_BUSINESS_PARTNER'
            },
            {
                serviceName: 'API_BUSINESS_PARTNER',
                entityName: 'A_Customer',
                serviceTitle: 'API_BUSINESS_PARTNER'
            },
            {
                serviceName: 'API_BUSINESS_PARTNER',
                entityName: 'A_BusinessPartnerAddress',
                serviceTitle: 'API_BUSINESS_PARTNER'
            }
        ];
    }
    
    logger.debug('No matching entities found');
        return [];
    }

/**
 * Find service for a known entity
 */
export function findServiceForKnownEntity(entityName: string): { service: string, entity: string, requiresParams?: boolean, mandatoryFilters?: string[] } | null {
    if (KNOWN_ENTITIES[entityName]) {
        return KNOWN_ENTITIES[entityName];
    }
    return null;
}

/**
 * Check if an API requires mandatory parameters
 */
export function isParameterBasedAPI(serviceName: string): boolean {
    return PARAMETER_BASED_APIS.hasOwnProperty(serviceName);
}

/**
 * Get mandatory filters for a parameter-based API
 */
export function getMandatoryFilters(serviceName: string): string[] {
    const apiConfig = PARAMETER_BASED_APIS[serviceName];
    return apiConfig ? apiConfig.mandatoryFilters : [];
}

/**
 * Validate that all mandatory filters are provided
 */
export function validateMandatoryFilters(serviceName: string, filters: Array<{field: string, operator: string, value: string}>): { isValid: boolean, missingFilters: string[] } {
    const mandatoryFilters = getMandatoryFilters(serviceName);
    if (mandatoryFilters.length === 0) {
        return { isValid: true, missingFilters: [] };
    }

    const providedFilterFields = filters.map(f => f.field);
    const missingFilters = mandatoryFilters.filter(mandatory => !providedFilterFields.includes(mandatory));
    
    return {
        isValid: missingFilters.length === 0,
        missingFilters
    };
}

/**
 * Get entity data
 */
export async function getEntityData(serviceName: string, entityName: string, filters?: Array<{field: string, operator: string, value: string}>): Promise<any> {
    const cacheKey = `entity_${serviceName}_${entityName}_${JSON.stringify(filters || {})}`;
    
    // Check cache first
    if (entityDataCache.has(cacheKey)) {
        logger.debug(`Using cached entity data for ${serviceName}/${entityName}`);
        return entityDataCache.get(cacheKey)!;
    }

    // Validate mandatory filters for parameter-based APIs
    if (isParameterBasedAPI(serviceName)) {
        const validation = validateMandatoryFilters(serviceName, filters || []);
        if (!validation.isValid) {
            const error = new Error(`Missing mandatory filters for ${serviceName}: ${validation.missingFilters.join(', ')}`);
            logger.error(error.message);
            throw error;
        }
    }

    try {
        logger.debug(`Fetching entity data for ${serviceName}/${entityName}`);
        
        // Use destination service if available
        const destinationService = new DestinationService();
        const destination = await destinationService.getDestination('SED120');
        
        if (!destination) {
            throw new Error('Could not get destination configuration');
        }

        const client = await destinationService.createAxiosClient(destination);
        
        // Memory Guardrail: Enforce strict $top limits to prevent TSV_NEW_PAGE_ALLOC_FAILED
        // Maximum 100 records per API call as per memory guardrail policy
        const params: any = {
            '$top': 100, // Strict memory guardrail: max 100 records per call
            '$format': 'json'
        };
        
        logger.debug(`Fetching data for ${serviceName}/${entityName} with $top=${params['$top']} (memory guardrail enforced)`);
        
        // Handle parameter-based APIs differently
        if (isParameterBasedAPI(serviceName)) {
            const apiConfig = PARAMETER_BASED_APIS[serviceName];
            
            if (apiConfig?.urlPattern === 'function_import') {
                // For function import pattern, build URL with parameters in path
                if (filters && filters.length > 0) {
                    const paramPairs = filters.map(filter => `${filter.field}='${filter.value}'`).join(',');
                    const functionUrl = `/sap/opu/odata/sap/${serviceName}/${apiConfig.entity}(${paramPairs})/Results`;
                    
                    logger.debug(`Making function import request to: ${functionUrl}`);
                    logger.debug(`Query parameters: ${JSON.stringify(params)}`);
                    
                    const response = await client.get(functionUrl, {
                        params,
                        headers: { 'Accept': 'application/json' },
                        timeout: 60000,
                        maxContentLength: 50 * 1024 * 1024,
                        maxBodyLength: 50 * 1024 * 1024
                    });
                    
                    logger.debug(`Raw response status: ${response.status}`);
                    logger.debug(`Raw response data keys: ${Object.keys(response.data || {})}`);
                    logger.debug(`Response data sample: ${JSON.stringify(response.data).substring(0, 500)}...`);
                    
                    const data = response.data.value || response.data.d?.results || [];
                    logger.debug(`Retrieved ${data.length} records from ${serviceName}/${entityName}`);
                    
                    // Cache the data
                    entityDataCache.set(cacheKey, data);
                    return data;
                }
            } else {
                // For regular parameter-based APIs, add parameters as query parameters
                if (filters && filters.length > 0) {
                    filters.forEach(filter => {
                        const { field, value } = filter;
                        params[field] = value;
                    });
                }
            }
        } else {
            // For regular APIs, use OData filters
            if (filters && filters.length > 0) {
                const filterConditions = filters.map(filter => {
                    const { field, operator, value } = filter;
                    switch (operator) {
                        case 'eq':
                            return `${field} eq '${value}'`;
                        case 'ne':
                            return `${field} ne '${value}'`;
                        case 'gt':
                            return `${field} gt '${value}'`;
                        case 'lt':
                            return `${field} lt '${value}'`;
                        case 'ge':
                            return `${field} ge '${value}'`;
                        case 'le':
                            return `${field} le '${value}'`;
                        case 'contains':
                            return `contains(${field},'${value}')`;
                        case 'startswith':
                            return `startswith(${field},'${value}')`;
                        default:
                            return `${field} eq '${value}'`;
                    }
                });
                params['$filter'] = filterConditions.join(' and ');
            }
        }
        
        logger.info(`Making request to: /sap/opu/odata/sap/${serviceName}/${entityName}`);
        logger.info(`Query parameters: ${JSON.stringify(params)}`);
        if (params['$filter']) {
            logger.info(`OData $filter: ${params['$filter']}`);
        }
        
        let response;
        try {
            // Use relative path - connectivity proxy handles routing via SAP-Connectivity-Destination header
            response = await client.get(`/sap/opu/odata/sap/${serviceName}/${entityName}`, {
                params,
                headers: { 'Accept': 'application/json' },
                timeout: 60000, // Increase timeout to 60 seconds
                maxContentLength: 50 * 1024 * 1024, // Limit response to 50MB
                maxBodyLength: 50 * 1024 * 1024
            });
        } catch (error: any) {
            logger.error(`OData request failed for ${serviceName}/${entityName}`);
            logger.error(`Request URL: /sap/opu/odata/sap/${serviceName}/${entityName}`);
            logger.error(`Request params: ${JSON.stringify(params)}`);
            if (error.response) {
                logger.error(`SAP Error Status: ${error.response.status}`);
                logger.error(`SAP Error Data: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
        
        logger.info(`Raw response status: ${response.status}`);
        logger.debug(`Raw response data keys: ${Object.keys(response.data || {})}`);
        logger.debug(`Response data sample: ${JSON.stringify(response.data).substring(0, 500)}...`);
        
        const data = response.data.value || response.data.d?.results || [];
        logger.debug(`Retrieved ${data.length} records from ${serviceName}/${entityName}`);
        
        // Cache the data
        entityDataCache.set(cacheKey, data);
        return data;
        
    } catch (error: any) {
        logger.error(`Error fetching entity data for ${serviceName}/${entityName}:`, error.message);
        if (error.response) {
            logger.error(`SAP Response Status: ${error.response.status}`);
            logger.error(`SAP Response Data: ${JSON.stringify(error.response.data)}`);
            const sapErrorMessage = error.response.data?.error?.message?.value || 
                                   error.response.data?.error?.message || 
                                   JSON.stringify(error.response.data);
            throw new SAPError(`SAP OData Error (${error.response.status}): ${sapErrorMessage}`);
        }
        throw new SAPError(`Could not fetch entity data for ${entityName} from ${serviceName}: ${error.message}`);
    }
}