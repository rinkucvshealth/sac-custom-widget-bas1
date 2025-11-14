import express from 'express';
import { interpretQuery } from '../clients/openai-client';
import { getEntityData, getServiceMetadata, findServiceForKnownEntity, isParameterBasedAPI, getMandatoryFilters, validateMandatoryFilters } from '../clients/sap-client';
import { DestinationService } from '../clients/destination-client';
import { logger } from '../utils/logger';
import { ChatQueryRequest, ChatQueryResponse } from '../types';
import { SERVICE_WHITELIST } from '../constants';
import { mapFieldToAPI, getAPIAmountField, isAmountField as isAPIAmountField, mapFiltersToAPI } from '../utils/api-field-mapper';
import { calculateAggregation, mightHaveMoreRecords } from '../utils/aggregation-helper';

const router = express.Router();

// Session context storage (in production, use Redis or database)
const sessionContexts = new Map<string, {
  lastEntity?: string;
  lastService?: string;
  lastFields?: string[];
  activeFilters?: Record<string, any>; // Store all active filters
  timestamp: number;
}>();

// Clean up old sessions (older than 30 minutes)
const cleanupOldSessions = () => {
  const now = Date.now();
  const thirtyMinutes = 30 * 60 * 1000;
  
  for (const [sessionId, context] of sessionContexts.entries()) {
    if (now - context.timestamp > thirtyMinutes) {
      sessionContexts.delete(sessionId);
    }
  }
};

// Run cleanup every 10 minutes
setInterval(cleanupOldSessions, 10 * 60 * 1000);

/**
 * GET /api/chat/test-entities
 * Test multiple entities to see which has data
 */
router.get('/test-entities', async (req: express.Request, res: express.Response) => {
  try {
    logger.info('Testing multiple entities for data...');
    
    // Try the exact path that worked in your screenshot
    const entitiesToTry = [
      'A_BusinessPartner',  // Original
      'BusinessPartner',    // Without A_ prefix
      'A_Customer',         // Customer entity
      'Customer',           // Without A_ prefix
      'A_BusinessPartnerAddress', // Address
      'BusinessPartnerAddress'    // Without A_ prefix
    ];
    
    const results: any[] = [];
    
    for (const entityName of entitiesToTry) {
      try {
        logger.debug(`Testing entity: ${entityName}`);
        const data = await getEntityData('API_BUSINESS_PARTNER', entityName);
        results.push({
          entity: entityName,
          recordCount: data ? data.length : 0,
          hasData: data && data.length > 0,
          sampleData: data && data.length > 0 ? data[0] : null
        });
        logger.debug(`${entityName}: ${data ? data.length : 0} records`);
      } catch (error: any) {
        results.push({
          entity: entityName,
          recordCount: 0,
          hasData: false,
          error: error.message
        });
        logger.debug(`${entityName}: Error - ${error.message}`);
      }
    }
    
    return res.json({
      success: true,
      message: 'Entity test completed',
      results: results
    });
    
  } catch (error: any) {
    logger.error('Error testing entities:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/chat/test-sap
 * Test SAP connectivity
 */
router.get('/test-sap', async (req: express.Request, res: express.Response) => {
  try {
    logger.info('Testing SAP connectivity...');
    
    // Test basic connectivity to API_BUSINESS_PARTNER
    const testService = 'API_BUSINESS_PARTNER';
    const metadata = await getServiceMetadata(testService);
    
    return res.json({
      success: true,
      message: 'SAP connection successful',
      service: testService,
      entityCount: metadata.entitySets.length,
      entities: metadata.entitySets.slice(0, 5).map(e => e.name)
    });
  } catch (error: any) {
    logger.error('SAP connectivity test failed:', error);
    return res.status(500).json({
      success: false,
      message: 'SAP connection failed',
      error: error.message
    });
  }
});

/**
 * GET /api/chat/test-connection
 * Test basic SAP connection using destination service
 */
router.get('/test-connection', async (req: express.Request, res: express.Response) => {
  try {
    logger.info('Testing SAP connection with destination service...');
    
    // Use the SAP client functions which include destination service integration
    const { getServiceMetadata } = require('../clients/sap-client');
    
    try {
      // First, try to access the root OData service to see what's available
      const { DestinationService } = require('../clients/destination-client');
      const destinationService = new DestinationService();
        const destination = await destinationService.getDestination('DIP_SEQ_DEST_200');
      
      if (!destination) {
        throw new Error('Could not get destination configuration');
      }

      const client = await destinationService.createAxiosClient(destination);
      
      // Try to access the working A_BusinessPartner endpoint first
      try {
        const businessPartnerResponse = await client.get('/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner', {
          headers: { 'Accept': 'application/json' },
          timeout: 10000
        });
        
        return res.json({
          success: true,
          message: 'SAP connection successful - A_BusinessPartner endpoint accessible',
          data: {
            destination: destination.Name,
            url: destination.URL,
            proxyType: destination.ProxyType,
            status: businessPartnerResponse.status,
            responseSize: businessPartnerResponse.data ? JSON.stringify(businessPartnerResponse.data).length : 0,
            note: 'Successfully connected to SAP OData service'
          }
        });
      } catch (businessPartnerError: any) {
        logger.warn('A_BusinessPartner endpoint failed, trying root OData service:', businessPartnerError.message);
        
        // If A_BusinessPartner fails, try root OData service
        try {
          const rootResponse = await client.get('/sap/opu/odata/sap/', {
            headers: { 'Accept': 'application/json' },
            timeout: 10000
          });
          
          return res.json({
            success: true,
            message: 'SAP connection successful - Root OData service accessible',
            data: {
              destination: destination.Name,
              url: destination.URL,
              proxyType: destination.ProxyType,
              rootServiceResponse: rootResponse.data
            }
          });
        } catch (rootError: any) {
          logger.warn('Root OData service failed, trying metadata endpoint:', rootError.message);
          
          // If root service fails, try metadata endpoint
          const metadata = await getServiceMetadata('API_BUSINESS_PARTNER');
          
          return res.json({
            success: true,
            message: 'SAP connection successful via destination service',
            results: [{
              url: 'API_BUSINESS_PARTNER service',
              success: true,
              status: 200,
              entityCount: metadata.entities.length,
              entities: metadata.entities.map((e: any) => e.name)
            }]
          });
        }
      }
    } catch (error: any) {
      logger.error('SAP connection via destination service failed:', error);
      
      return res.status(500).json({
        success: false,
        message: 'SAP connection failed',
        error: error.message,
        code: error.code,
        status: error.response?.status
      });
    }
  } catch (error: any) {
    logger.error('Basic SAP connection test failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Basic SAP connection failed',
      error: error.message,
      code: error.code,
      status: error.response?.status
    });
  }
});

/**
 * GET /api/chat/test-gateway-query
 * Test the exact same query that works in SAP Gateway Client
 */
router.get('/test-gateway-query', async (req: express.Request, res: express.Response) => {
  try {
    logger.info('Testing exact SAP Gateway Client query...');
    
    const destinationService = new DestinationService();
      const destination = await destinationService.getDestination('DIP_SEQ_DEST_200');
    
    if (!destination) {
      throw new Error('Could not get destination configuration');
    }

    const client = await destinationService.createAxiosClient(destination);
    
    // Test 1: Try with minimal parameters (like SAP Gateway Client)
    logger.info('Test 1: Minimal query (like SAP Gateway Client)');
    try {
      const response1 = await client.get('/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner', {
        headers: { 'Accept': 'application/json' },
        timeout: 30000
      });
      
      logger.info(`Test 1 Success: Status ${response1.status}, Data size: ${JSON.stringify(response1.data).length} bytes`);
      
      return res.json({
        success: true,
        message: 'Gateway query successful',
        status: response1.status,
        dataSize: JSON.stringify(response1.data).length,
        recordCount: (response1.data.value || response1.data.d?.results || []).length,
        sampleData: (response1.data.value || response1.data.d?.results || []).slice(0, 2)
      });
      
    } catch (error1: any) {
      logger.error(`Test 1 failed: ${error1.message}`);
      
      // Test 2: Try with $top parameter
      logger.info('Test 2: With $top=5 parameter');
      try {
        const response2 = await client.get('/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner', {
          params: { '$top': 5, '$format': 'json' },
          headers: { 'Accept': 'application/json' },
          timeout: 30000
        });
        
        logger.info(`Test 2 Success: Status ${response2.status}, Data size: ${JSON.stringify(response2.data).length} bytes`);
        
        return res.json({
          success: true,
          message: 'Gateway query with $top successful',
          status: response2.status,
          dataSize: JSON.stringify(response2.data).length,
          recordCount: (response2.data.value || response2.data.d?.results || []).length,
          sampleData: (response2.data.value || response2.data.d?.results || []).slice(0, 2)
        });
        
      } catch (error2: any) {
        logger.error(`Test 2 failed: ${error2.message}`);
        
        return res.json({
          success: false,
          message: 'Both gateway tests failed',
          errors: {
            test1: error1.message,
            test2: error2.message
          }
        });
      }
    }
    
  } catch (error: any) {
    logger.error('Gateway query test failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Gateway query test failed',
      error: error.message
    });
  }
});

/**
 * GET /api/chat/discover-services
 * Discover available SAP services
 */
router.get('/discover-services', async (req: express.Request, res: express.Response) => {
  try {
    logger.info('Discovering SAP services...');
    
    const commonServices = [
      'API_BUSINESS_PARTNER',
      'API_SALES_ORDER_SRV', 
      'API_PRODUCT_SRV',
      'API_CUSTOMER_SRV',
      'API_MATERIAL_SRV',
      'API_MATERIAL_DOCUMENT_SRV',
      'API_CUSTOMER_MATERIAL_SRV',
      'MMIM_MATERIAL_DATA_SRV',
      'ZAPI_SALES_ORDER_SRV',
      'ZAPI_PRODUCT_SRV',
      'ZAPI_CUSTOMER_SRV'
    ];
    
    const availableServices = [];
    
    for (const service of commonServices) {
      try {
        const metadata = await getServiceMetadata(service);
        availableServices.push({
          name: service,
          entityCount: metadata.entitySets.length,
          entities: metadata.entitySets.slice(0, 3).map(e => e.name)
        });
        logger.info(`Found service: ${service} with ${metadata.entitySets.length} entities`);
      } catch (error: any) {
        logger.error(`Service ${service} not available: ${error.message}`);
        logger.error(`Full error for ${service}:`, error);
      }
    }
    
    return res.json({
      success: true,
      message: `Found ${availableServices.length} available services`,
      services: availableServices
    });
  } catch (error: any) {
    logger.error('Service discovery failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Service discovery failed',
      error: error.message
    });
  }
});

/**
 * POST /api/chat/query
 * Main endpoint for processing natural language queries
 */
router.post('/query', async (req: express.Request, res: express.Response) => {
  try {
    const { query, context, sessionId }: ChatQueryRequest = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required and must be a non-empty string'
      });
    }

    logger.info(`Received query: "${query}"`);

    // Get or create session context
    const sessionKey = sessionId || 'default';
    let sessionContext = sessionContexts.get(sessionKey);
    if (!sessionContext) {
      sessionContext = { timestamp: Date.now() };
      sessionContexts.set(sessionKey, sessionContext);
    } else {
      sessionContext.timestamp = Date.now(); // Update timestamp
    }

    logger.info(`Session context for ${sessionKey}:`, {
      lastEntity: sessionContext.lastEntity,
      lastService: sessionContext.lastService,
      hasLastFields: !!sessionContext.lastFields,
      activeFilters: sessionContext.activeFilters || {}
    });

    // Step 1: Interpret the query using OpenAI with context
    const interpretation = await interpretQuery(query, sessionContext);
    
    if (!interpretation) {
      return res.status(500).json({
        success: false,
        error: 'Failed to interpret query. Please try rephrasing.'
      });
    }

    logger.debug('Query interpretation:', interpretation);

    const { command, args } = interpretation;

    // Step 2: Handle the command
    if (command === 'clarify_service') {
      // Find matching services and entities
      const { entityName, filters: queryFilters } = args;
      
      // Combine session context filters with current query filters
      const combinedFilters = {
        ...(sessionContext.activeFilters || {}),
        ...(queryFilters || {})
      };
      
      logger.info(`Filter combination for ${sessionKey}:`, {
        activeFilters: sessionContext.activeFilters || {},
        queryFilters: queryFilters || {},
        combinedFilters: combinedFilters
      });
      
      // Convert combined filters to the format expected by getEntityData
      // Field mapping will be done after we determine the API and entity
      const filters = Object.entries(combinedFilters).map(([field, value]) => ({
        field,
        operator: 'eq',
        value: String(value)
      }));
      
      logger.info(`Converted filters for ${sessionKey}:`, filters);
      
      // Real SAP integration - find and fetch actual data
      
      // Try multiple entities to find one with data
      let candidates: any[] = [];
      
      // First, check if it's a known entity
      const knownEntity = findServiceForKnownEntity(entityName);
      if (knownEntity) {
        logger.debug(`Found known entity: ${entityName} -> ${knownEntity.service}/${knownEntity.entity}`);
        
        // Map filters to API field names using the generic mapper
        const mappedFilters = mapFiltersToAPI(knownEntity.service, knownEntity.entity, filters);
        logger.info(`Mapped filters for ${knownEntity.service}/${knownEntity.entity}:`, mappedFilters);
        
        // Check if this is a parameter-based API
        if (isParameterBasedAPI(knownEntity.service)) {
          const validation = validateMandatoryFilters(knownEntity.service, mappedFilters || []);
          if (!validation.isValid) {
            const mandatoryFilters = getMandatoryFilters(knownEntity.service);
            return res.json({
              success: false,
              summary: `This query requires additional parameters. Please provide: ${mandatoryFilters.join(', ')}`,
              data: [],
              fields: [],
              entity: entityName,
              recordCount: 0,
              error: `Missing mandatory filters: ${validation.missingFilters.join(', ')}`,
              requiresParameters: true,
              mandatoryFilters: mandatoryFilters,
              exampleQuery: `Show me ${entityName.toLowerCase()} for customer 90000`
            } as ChatQueryResponse);
          }
        }
        
        // Always add known entities to candidates, even if data fetch fails
        // (failures might be due to permissions, filters, etc. - we'll surface the actual error later)
        candidates = [{
          serviceName: knownEntity.service,
          entityName: knownEntity.entity,
          serviceTitle: knownEntity.service
        }];
        
        // Try to verify the service is accessible (optional check)
        try {
          const data = await getEntityData(knownEntity.service, knownEntity.entity, mappedFilters);
          if (data && data.length > 0) {
            logger.debug(`Found ${data.length} records in known entity ${entityName}`);
          } else {
            logger.debug(`Known entity ${entityName} exists but returned no data (might need filters)`);
          }
        } catch (error: any) {
          logger.debug(`Failed to get data from known entity ${entityName}:`, error);
          // If it's a parameter validation error, return a helpful message
          if (error.message.includes('Missing mandatory filters')) {
            const mandatoryFilters = getMandatoryFilters(knownEntity.service);
            return res.json({
              success: false,
              summary: `This query requires additional parameters. Please provide: ${mandatoryFilters.join(', ')}`,
              data: [],
              fields: [],
              entity: entityName,
              recordCount: 0,
              error: error.message,
              requiresParameters: true,
              mandatoryFilters: mandatoryFilters,
              exampleQuery: `Show me ${entityName.toLowerCase()} for customer 90000`
            } as ChatQueryResponse);
          }
          // For other errors (like 403), we'll still try to use the service - let the error bubble up in the final fetch
          logger.warn(`Known entity ${entityName} exists but data fetch failed: ${error.message}`);
        }
      }
      
      // If no known entity found, try the default entities
      if (candidates.length === 0) {
        const entitiesToTry = [
          'A_BusinessPartner', 
          'A_Customer', 
          'A_BusinessPartnerAddress', 
          'GLAccountLineItem',
          'A_MaterialDocumentItem',
          'A_CustomerMaterial',
          'I_InvtryMgmtMatlMstrVH',
          'I_InvtryMgmtSuplrInfoRecdVH'
        ];
        
        // Enhanced entity matching logic
        const entityLower = entityName.toLowerCase();
        if (entityLower.includes('customer') || 
            entityLower.includes('business') || 
            entityLower.includes('partner') ||
            entityLower.includes('return') ||
            entityLower.includes('delivery') ||
            entityLower.includes('glaccount') ||
            entityLower.includes('accountline') ||
            entityLower.includes('ledger') ||
            entityLower.includes('accounting') ||
            entityLower.includes('financial') ||
            entityLower.includes('material') ||
            entityLower.includes('inventory') ||
            entityLower.includes('stock') ||
            entityLower.includes('document') ||
            entityLower.includes('supplier') ||
            entityLower.includes('vendor') ||
            entityLower.includes('master') ||
            entityLower.includes('data') || // Generic data request
            entityLower.includes('dataset') || // Generic dataset request
            entityLower.includes('records') || // Generic records request
            entityLower.includes('results')) { // Generic results request
          
          logger.debug('Found customer/business partner/returns query, trying multiple entities');
          
          for (const entityToTry of entitiesToTry) {
            try {
              logger.debug(`Trying to get data from ${entityToTry}`);
              
              // Determine the correct service for each entity
              let serviceName = 'API_BUSINESS_PARTNER';
              if (entityToTry === 'GLAccountLineItem') {
                serviceName = 'API_GLACCOUNTLINEITEM';
              } else if (entityToTry === 'A_MaterialDocumentItem') {
                serviceName = 'API_MATERIAL_DOCUMENT_SRV';
              } else if (entityToTry === 'A_CustomerMaterial') {
                serviceName = 'API_CUSTOMER_MATERIAL_SRV';
              } else if (entityToTry === 'I_InvtryMgmtMatlMstrVH' || entityToTry === 'I_InvtryMgmtSuplrInfoRecdVH') {
                serviceName = 'MMIM_MATERIAL_DATA_SRV';
              }
              
              // Map filters for this API/entity combination
              const mappedFiltersForEntity = mapFiltersToAPI(serviceName, entityToTry, filters);
              const data = await getEntityData(serviceName, entityToTry, mappedFiltersForEntity);
              if (data && data.length > 0) {
                logger.debug(`Found ${data.length} records in ${entityToTry}`);
                candidates = [{
                  serviceName: serviceName,
                  entityName: entityToTry,
                  serviceTitle: serviceName
                }];
                break;
              } else {
                logger.debug(`No data found in ${entityToTry}, trying next entity`);
              }
            } catch (error) {
              logger.debug(`Failed to get data from ${entityToTry}:`, error);
            }
          }
        }
      }
      
      if (candidates.length === 0) {
        return res.json({
          success: false,
          summary: `No services found for "${entityName}". Please check the available services.`,
          data: [],
          fields: [],
          entity: entityName,
          recordCount: 0,
          error: 'No matching services found'
        } as ChatQueryResponse);
      }

      // Use the best match
      const bestMatch = candidates[0];
      logger.info(`Best match: ${bestMatch.serviceName} / ${bestMatch.entityName}`);

      // Map filters to API field names before fetching
      const mappedFiltersForEntity = mapFiltersToAPI(bestMatch.serviceName, bestMatch.entityName, filters);
      logger.info(`Mapped filters for ${bestMatch.serviceName}/${bestMatch.entityName}:`, mappedFiltersForEntity);
      
      // Fetch the data
      const sapData = await getEntityData(bestMatch.serviceName, bestMatch.entityName, mappedFiltersForEntity);
      const results = sapData || [];

      // Extract fields
      const fields = results.length > 0 ? Object.keys(results[0]).filter(k => !k.startsWith('_')) : [];

      // Generate summary
      const summary = generateSummary(results, bestMatch.entityName, combinedFilters);

      // Update session context with successful query
      sessionContext.lastEntity = bestMatch.entityName;
      sessionContext.lastService = bestMatch.serviceName;
      sessionContext.lastFields = fields;
      
      // Store active filters from the current query
      if (interpretation.args && interpretation.args.filters) {
        sessionContext.activeFilters = {
          ...(sessionContext.activeFilters || {}),
          ...interpretation.args.filters
        };
        logger.info(`Updated active filters for ${sessionKey}:`, sessionContext.activeFilters);
      }
      
      logger.info(`Updated session context for ${sessionKey}:`, {
        entity: bestMatch.entityName,
        service: bestMatch.serviceName,
        fieldsCount: fields.length,
        activeFilters: sessionContext.activeFilters
      });

      return res.json({
        success: true,
        summary,
        data: results,
        fields,
        entity: bestMatch.entityName,
        serviceName: bestMatch.serviceName,
        recordCount: results.length,
        sessionId: sessionKey
      } as ChatQueryResponse);

    } else if (command === 'select_service') {
      // User explicitly selected a service
      const { serviceName } = args;
      
      // Get metadata to show available entities
      const metadata = await getServiceMetadata(serviceName);
      
      return res.json({
        success: true,
        summary: `Service ${serviceName} selected. Available entities: ${metadata.entitySets.map(e => e.name).slice(0, 5).join(', ')}...`,
        data: [],
        fields: [],
        entity: '',
        serviceName,
        recordCount: 0
      } as ChatQueryResponse);

    } else if (command === 'aggregate_data') {
      // Handle aggregation queries
      const { entityName, aggregationType, aggregationField, filters: queryFilters } = args;
      
      logger.info(`Processing aggregation query: ${aggregationType}(${aggregationField}) for ${entityName}`);
      
      // Combine session context filters with current query filters
      const combinedFilters = {
        ...(sessionContext.activeFilters || {}),
        ...(queryFilters || {})
      };
      
      logger.info(`Aggregation filter combination for ${sessionKey}:`, {
        activeFilters: sessionContext.activeFilters || {},
        queryFilters: queryFilters || {},
        combinedFilters: combinedFilters
      });
      
      // Convert combined filters to the format expected by getEntityData
      // Field mapping will be done after we determine the API and entity
      const filters = Object.entries(combinedFilters).map(([field, value]) => ({
        field,
        operator: 'eq',
        value: String(value)
      }));
      
      logger.info(`Initial filters for aggregation:`, filters);
      
      // Find matching services and entities for aggregation
      const candidates: any[] = [];
      
      // First, check if it's a known entity (faster and more reliable)
      const knownEntity = findServiceForKnownEntity(entityName);
      if (knownEntity) {
        logger.debug(`Found known entity for aggregation: ${entityName} -> ${knownEntity.service}/${knownEntity.entity}`);
        candidates.push({
          serviceName: knownEntity.service,
          entityName: knownEntity.entity,
          score: 1.0
        });
      }
      
      // If no known entity found, search metadata
      if (candidates.length === 0) {
        for (const serviceName of SERVICE_WHITELIST) {
          try {
            const metadata = await getServiceMetadata(serviceName);
            const matchingEntities = metadata.entitySets.filter(entity => 
              entity.name.toLowerCase().includes(entityName.toLowerCase()) ||
              entityName.toLowerCase().includes(entity.name.toLowerCase())
            );
            
            for (const entity of matchingEntities) {
              candidates.push({
                serviceName,
                entityName: entity.name,
                score: 1.0,
                metadata: entity
              });
            }
          } catch (error) {
            logger.debug(`Failed to get metadata for ${serviceName}:`, error);
          }
        }
      }
      
      if (candidates.length === 0) {
        return res.json({
          success: false,
          summary: `No services found for aggregation on ${entityName}`,
          data: [],
          fields: [],
          entity: entityName,
          serviceName: '',
          recordCount: 0,
          sessionId: sessionKey
        } as ChatQueryResponse);
      }
      
      // Sort by score and take the best match
      candidates.sort((a, b) => b.score - a.score);
      const bestMatch = candidates[0];
      
      logger.info(`Best match for aggregation: ${bestMatch.serviceName}/${bestMatch.entityName}`);
      
      // Map filters to API field names using the generic mapper
      const mappedFilters = mapFiltersToAPI(bestMatch.serviceName, bestMatch.entityName, filters);
      logger.info(`Mapped filters for aggregation:`, mappedFilters);
      
      // Fetch data for aggregation with pagination support
      let sapData: any[] = [];
      let totalRecordsFetched = 0;
      const maxPages = 10; // Safety limit: max 10 pages = 1000 records total
      
      try {
        // Fetch first page
        sapData = await getEntityData(bestMatch.serviceName, bestMatch.entityName, mappedFilters);
        totalRecordsFetched = sapData.length;
        logger.info(`Retrieved ${sapData.length} records for aggregation (page 1)`);
        
        // Check if we need to fetch more pages for complete aggregation
        if (sapData.length === 100) { // If we got exactly 100, there might be more
          logger.warn(`Memory guardrail: Fetched exactly 100 records. Aggregation may be incomplete.`);
          logger.warn(`For complete aggregation, consider adding more specific filters to reduce dataset size.`);
        }
        
        // Debug: Log sample record to see available fields
        if (sapData.length > 0) {
          logger.info(`Sample record fields:`, Object.keys(sapData[0]));
          logger.info(`Sample record data:`, JSON.stringify(sapData[0], null, 2));
        }
      } catch (error: any) {
        logger.error(`Failed to fetch data for aggregation:`, error);
        
        // Extract user-friendly error message
        let errorMessage = 'Failed to fetch data for aggregation.';
        let errorDetails = '';
        
        if (error.name === 'SAPError' || error.code === 'SAP_ERROR') {
          // SAP authorization error (403)
          if (error.message && error.message.includes('403') || error.message && error.message.includes('authorization')) {
            errorMessage = 'Authorization Error: Access to this SAP service is not authorized.';
            errorDetails = `The user account does not have permission to access ${bestMatch.serviceName}. Please contact your SAP Basis team to grant the required authorizations.`;
          } else if (error.message) {
            errorMessage = error.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return res.json({
          success: false,
          summary: errorMessage,
          error: errorDetails || errorMessage,
          data: [],
          fields: [],
          entity: bestMatch.entityName,
          serviceName: bestMatch.serviceName,
          recordCount: 0,
          sessionId: sessionKey
        } as ChatQueryResponse);
      }
      
      // Perform aggregation
      let aggregationResult: any;
      
      // Map aggregation field to API field name using the generic mapper
      let numericField = mapFieldToAPI(bestMatch.serviceName, bestMatch.entityName, aggregationField);
      logger.info(`Mapped aggregation field "${aggregationField}" to API field "${numericField}" for ${bestMatch.serviceName}/${bestMatch.entityName}`);
      
      // If aggregating amount-related field, use the primary amount field for this API
      if (isAPIAmountField(bestMatch.serviceName, bestMatch.entityName, aggregationField) || 
          aggregationField.toLowerCase() === 'amount') {
        const primaryAmountField = getAPIAmountField(bestMatch.serviceName, bestMatch.entityName);
        if (primaryAmountField) {
          numericField = primaryAmountField;
          logger.info(`Using primary amount field for ${bestMatch.serviceName}: ${numericField}`);
        }
      }
      
      // Verify the field exists in the actual data and find alternatives if needed
      if (sapData.length > 0 && !sapData[0].hasOwnProperty(numericField)) {
        logger.warn(`Mapped field "${numericField}" not found in data. Available fields: ${Object.keys(sapData[0]).join(', ')}`);
        
        // Try to find the field in the data (case-insensitive)
        const availableFields = Object.keys(sapData[0]);
        const foundField = availableFields.find(f => f.toLowerCase() === numericField.toLowerCase());
        if (foundField) {
          numericField = foundField;
          logger.info(`Found case-insensitive match: ${numericField}`);
        } else {
          // Try to find any amount-related field as fallback
          const possibleAmountFields = availableFields.filter(key => 
            key.toLowerCase().includes('amount') || 
            key.toLowerCase().includes('currency') ||
            key.toLowerCase().includes('value')
          );
          if (possibleAmountFields.length > 0) {
            numericField = possibleAmountFields[0];
            logger.info(`Using fallback amount field from data: ${numericField}`);
          }
        }
      }
      
      try {
        // Use helper function for accurate aggregation matching SAP behavior
        aggregationResult = calculateAggregation(
          sapData, 
          numericField, 
          aggregationType as 'sum' | 'count' | 'avg' | 'max' | 'min',
          2 // 2 decimal precision to match SAP
        );
        
        // Memory guardrail warning for incomplete aggregations
        if (sapData.length === 100) {
          logger.warn(`Memory guardrail enforced: Aggregation limited to first 100 records.`);
          logger.warn(`Result may be incomplete. Add more specific filters to reduce dataset size.`);
        }
        
        logger.info(`Aggregation result: ${aggregationResult} (${aggregationType} of ${numericField} from ${sapData.length} records)`);
      } catch (error) {
        logger.error(`Failed to perform aggregation:`, error);
        aggregationResult = 'Error in aggregation calculation';
      }
      
      // Format aggregation result
      const formattedResult = typeof aggregationResult === 'number' ? 
        aggregationResult.toLocaleString() : aggregationResult;
      
      // Create summary with memory guardrail info
      const isIncomplete = sapData.length === 100;
      const summary = `${aggregationType.toUpperCase()}(${aggregationField}) for ${bestMatch.entityName}: ${formattedResult} (from ${sapData.length} records${isIncomplete ? ' - limited by memory guardrail' : ''})`;
      
      // Update session context
      sessionContext.lastEntity = bestMatch.entityName;
      sessionContext.lastService = bestMatch.serviceName;
      sessionContext.lastFields = [aggregationField];
      sessionContext.activeFilters = combinedFilters;
      sessionContext.timestamp = Date.now();
      
      return res.json({
        success: true,
        summary,
        data: [{ [aggregationType]: aggregationResult, recordCount: sapData.length }],
        fields: [aggregationType, 'recordCount'],
        entity: bestMatch.entityName,
        serviceName: bestMatch.serviceName,
        recordCount: 1,
        sessionId: sessionKey
      } as ChatQueryResponse);

    } else {
      return res.status(400).json({
        success: false,
        error: `Unknown command: ${command}`
      });
    }

  } catch (error: any) {
    logger.error('Error processing chat query:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      summary: 'An error occurred while processing your request.',
      data: [],
      fields: [],
      entity: '',
      recordCount: 0
    } as ChatQueryResponse);
  }
});

/**
 * Generate a human-readable summary of the results
 */
function generateSummary(results: any[], entityName: string, filters?: { [key: string]: string }): string {
  const count = results.length;
  
  if (count === 0) {
    return `No ${entityName} records found${filters ? ` matching your criteria` : ''}.`;
  }
  
  let summary = `Found ${count} ${entityName} record${count !== 1 ? 's' : ''}`;
  
  if (filters && Object.keys(filters).length > 0) {
    const filterDesc = Object.entries(filters)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    summary += ` matching ${filterDesc}`;
  }
  
  summary += '.';
  
  return summary;
}

export default router;

