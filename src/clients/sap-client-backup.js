"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findServiceForEntitySimple = findServiceForEntitySimple;
exports.findServiceForEntity = findServiceForEntity;
exports.getServiceMetadata = getServiceMetadata;
exports.getServiceMetadata = getServiceMetadata;
exports.getEntityData = getEntityData;
const axios_1 = __importDefault(require("axios"));
const xml2js_1 = require("xml2js");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const types_1 = require("../types");
const constants_1 = require("../constants");
const cache_1 = require("../utils/cache");
const destination_client_1 = require("./destination-client");
/**
 * Calculate similarity score between two strings
 */
function calculateSimilarity(str1, str2) {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0)
        return 1;
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    return 1 - (distance / maxLength);
}
function levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i++)
        matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++)
        matrix[j][0] = j;
    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + indicator);
        }
    }
    return matrix[str2.length][str1.length];
}
/**
 * Find services that match the entity name using known entities (bypasses metadata discovery)
 */
async function findServiceForEntitySimple(entityNameToFind, filters) {
    logger_1.logger.debug(`Starting simple entity search for: "${entityNameToFind}"`);
    const cleanInput = entityNameToFind.replace(/\s/g, '').toLowerCase();
    const synonyms = [cleanInput];
    // Add entity-specific synonyms
    for (const [entityKey, entitySynonyms] of Object.entries(constants_1.ENTITY_SYNONYMS)) {
        if (cleanInput.includes(entityKey.toLowerCase())) {
            synonyms.push(...entitySynonyms.map((s) => s.toLowerCase()));
        }
    }
    const uniqueSynonyms = [...new Set(synonyms)];
    logger_1.logger.debug(`Synonym set for search: ${JSON.stringify(uniqueSynonyms)}`);
    const candidates = [];
    // Check known entities
    for (const [serviceName, entities] of Object.entries(constants_1.KNOWN_ENTITIES)) {
        logger_1.logger.debug(`Checking known entities for service: ${serviceName}`);
        for (const entity of entities) {
            let nameScore = 0;
            // Exact regex match
            for (const syn of uniqueSynonyms) {
                const regex = new RegExp(`(^|_|\\b)${syn}(\\b|$)`, 'i');
                if (regex.test(entity.name) || regex.test(entity.description)) {
                    nameScore = Math.max(nameScore, 5);
                    break;
                }
            }
            // Fuzzy matching
            if (nameScore === 0) {
                for (const syn of uniqueSynonyms) {
                    const similarity = Math.max(calculateSimilarity(syn, entity.name), calculateSimilarity(syn, entity.description));
                    if (similarity >= 0.7) {
                        nameScore = Math.max(nameScore, 3 + similarity);
                    }
                }
            }
            if (nameScore > 0) {
                candidates.push({
                    service: serviceName,
                    entity: entity.name,
                    description: entity.description,
                    score: nameScore,
                    fields: entity.fields
                });
                logger_1.logger.debug(`Found candidate: ${serviceName}/${entity.name} (score: ${nameScore})`);
            }
        }
    }
    // Sort by score and return top candidates
    const sortedCandidates = candidates.sort((a, b) => (b.score || 0) - (a.score || 0));
    logger_1.logger.debug(`Found ${sortedCandidates.length} candidates total`);
    return sortedCandidates;
}
/**
 * Find services that match the entity name (uses simple approach with known entities)
 */
async function findServiceForEntity(entityNameToFind, filters) {
    // Use the simple approach that bypasses metadata discovery
    return await findServiceForEntitySimple(entityNameToFind, filters);
}
/**
 * Get metadata for a service
 */
async function getServiceMetadata(serviceName) {
    serviceTitle: service.Title || serviceName,
        entityName;
    set.name,
        score;
    totalScore;
}
as;
Candidate;
;
try { }
catch (e) {
    logger_1.logger.error(`Failed to process service ${service.Name}:`, e.message);
}
;
await Promise.all(checkPromises);
if (candidates.length === 0) {
    logger_1.logger.warn(`No candidates found for entity: "${entityNameToFind}"`);
    return [];
}
const sorted = candidates.sort((a, b) => b.score - a.score);
const trimmed = sorted.slice(0, 25).map((candidate) => ({
    serviceName: candidate.serviceName,
    serviceTitle: candidate.serviceTitle,
    entityName: candidate.entityName
}));
logger_1.logger.info(`Returning ${trimmed.length} candidates for entity search`);
return trimmed;
/**
 * Get metadata for a service
 */
async function getServiceMetadata(serviceName) {
    if (!constants_1.SERVICE_WHITELIST.includes(serviceName)) {
        logger_1.logger.error(`Security violation: Attempted to access non-whitelisted service: ${serviceName}`);
        throw new Error(`Service '${serviceName}' is not in the approved whitelist.`);
    }
    const cacheKey = `metadata:${serviceName}`;
    const cached = cache_1.serviceMetadataCache.get(cacheKey);
    if (cached) {
        logger_1.logger.debug(`Using cached metadata for service: ${serviceName}`);
        return cached;
    }
    const fetchAndParseMetadata = async (url) => {
        // Try to use destination service first
        let metadataClient;
        try {
            const destinationService = new destination_client_1.DestinationService();
            const destination = await destinationService.getDestination('SED120');
            if (destination) {
                logger_1.logger.info('Using destination service for SAP connection');
                metadataClient = await destinationService.createAxiosClient(destination);
            }
            else {
                logger_1.logger.info('Using direct connection for SAP connection');
                metadataClient = axios_1.default.create({
                    baseURL: url,
                    auth: {
                        username: config_1.config.sap.username,
                        password: config_1.config.sap.password,
                    },
                    httpsAgent: new (require('https').Agent)({
                        rejectUnauthorized: false // Allow self-signed certificates
                    }),
                    timeout: 30000, // 30 second timeout
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error in destination service:', error);
            logger_1.logger.info('Falling back to direct connection');
            metadataClient = axios_1.default.create({
                baseURL: url,
                auth: {
                    username: config_1.config.sap.username,
                    password: config_1.config.sap.password,
                },
                httpsAgent: new (require('https').Agent)({
                    rejectUnauthorized: false // Allow self-signed certificates
                }),
                timeout: 30000, // 30 second timeout
            });
        }
        const response = await metadataClient.get(`/$metadata`, {
            params: { 'sap-client': config_1.config.sap.client },
            headers: { 'Accept': 'application/xml' },
        });
        const parsedXml = await (0, xml2js_1.parseStringPromise)(response.data, { explicitArray: false, mergeAttrs: true });
        const dataServices = parsedXml['edmx:Edmx']?.['edmx:DataServices'];
        const schema = dataServices?.Schema;
        if (!schema) {
            throw new Error('Could not find a schema in the service metadata.');
        }
        const schemas = Array.isArray(schema) ? schema : [schema];
        const allEntityTypes = {};
        schemas.forEach(s => {
            if (s.EntityType) {
                const entityTypes = Array.isArray(s.EntityType) ? s.EntityType : [s.EntityType];
                entityTypes.forEach(et => {
                    const qualifiedName = s.Namespace ? `${s.Namespace}.${et.Name}` : et.Name;
                    allEntityTypes[qualifiedName] = et;
                });
            }
        });
        const schemaWithContainer = schemas.find(s => s.EntityContainer && s.EntityContainer.EntitySet);
        if (!schemaWithContainer) {
            throw new Error('Could not find a schema with an EntityContainer in the service metadata.');
        }
        const entitySets = schemaWithContainer.EntityContainer.EntitySet;
        if (!entitySets) {
            return { serviceName, entitySets: [] };
        }
        const entitySetArray = Array.isArray(entitySets) ? entitySets : [entitySets];
        const entitySetMetadata = entitySetArray.map(set => {
            const entityType = allEntityTypes[set.EntityType];
            let properties = [];
            if (entityType && entityType.Property) {
                const props = Array.isArray(entityType.Property) ? entityType.Property : [entityType.Property];
                properties = props.map(p => ({ name: p.Name, type: p.Type }));
            }
            return {
                name: set.Name,
                properties: properties
            };
        });
        return { serviceName, entitySets: entitySetMetadata };
    };
    try {
        const serviceUrl = `${config_1.SAP_ODATA_BASE_URL}${serviceName}`;
        logger_1.logger.debug(`Attempting metadata fetch for: ${serviceUrl}`);
        const result = await fetchAndParseMetadata(serviceUrl);
        cache_1.serviceMetadataCache.set(cacheKey, result);
        return result;
    }
    catch (error) {
        logger_1.logger.error(`Error getting metadata for ${serviceName}:`, error.message);
        throw new types_1.SAPError(`Could not fetch metadata for ${serviceName}.`);
    }
}
/**
 * Get entity data from SAP
 */
async function getEntityData(serviceName, entityName, filters) {
    if (!constants_1.SERVICE_WHITELIST.includes(serviceName)) {
        logger_1.logger.error(`Security violation: Attempted to access non-whitelisted service: ${serviceName}`);
        throw new Error(`Service '${serviceName}' is not in the approved whitelist.`);
    }
    const cacheKey = `entity:${serviceName}:${entityName}:${JSON.stringify(filters || {})}`;
    const cached = cache_1.entityDataCache.get(cacheKey);
    if (cached) {
        logger_1.logger.debug(`Using cached entity data for: ${serviceName}/${entityName}`);
        return cached;
    }
    const tryRequest = async () => {
        const serviceUrl = `${config_1.SAP_ODATA_BASE_URL}${serviceName}`;
        const client = axios_1.default.create({
            baseURL: serviceUrl,
            auth: {
                username: config_1.config.sap.username,
                password: config_1.config.sap.password,
            },
            httpsAgent: new (require('https').Agent)({
                rejectUnauthorized: false // Allow self-signed certificates
            }),
            timeout: 30000, // 30 second timeout
        });
        const requestParams = {
            'sap-client': config_1.config.sap.client,
            '$format': 'json',
            '$top': 100
        };
        if (filters && Object.keys(filters).length > 0) {
            const filterString = Object.entries(filters)
                .map(([key, value]) => `${key} eq '${value}'`)
                .join(' and ');
            requestParams['$filter'] = filterString;
        }
        logger_1.logger.debug(`Fetching data from: ${serviceUrl}/${entityName}`);
        logger_1.logger.debug(`Parameters: ${JSON.stringify(requestParams)}`);
        const response = await client.get(`/${entityName}`, {
            params: requestParams,
            headers: { 'Accept': 'application/json' },
        });
        return response.data;
    };
    try {
        const data = await tryRequest();
        cache_1.entityDataCache.set(cacheKey, data);
        return data;
    }
    catch (error) {
        logger_1.logger.error(`Error fetching entity data:`, error.message);
        throw new types_1.SAPError(`Could not fetch entity data for ${entityName} from ${serviceName}.`);
    }
}
