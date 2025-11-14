// Common types used across the application

export interface FoundEntity {
  serviceName: string;
  serviceTitle: string;
  entityName: string;
}

export interface EntityProperty {
  name: string;
  type: string;
}

export interface EntityMetadata {
  name: string;
  properties: EntityProperty[];
}

export interface ServiceMetadata {
  serviceName: string;
  entitySets: EntityMetadata[];
}

export interface ODataResponse<T = any> {
  d: {
    results: T[];
  };
}

export interface ChatQueryRequest {
  query: string;
  context?: {
    previousEntity?: string;
    previousService?: string;
  };
  sessionId?: string;
}

export interface ParameterBasedAPIConfig {
  service: string;
  entity: string;
  mandatoryFilters: string[];
  optionalFilters?: string[];
  description?: string;
  exampleQuery?: string;
  urlPattern?: 'function_import' | 'query_params';
}

export interface ChatQueryResponse {
  success: boolean;
  summary: string;
  data: any[];
  fields: string[];
  entity: string;
  serviceName?: string;
  odataQuery?: string;
  recordCount: number;
  error?: string;
  requiresParameters?: boolean;
  mandatoryFilters?: string[];
  exampleQuery?: string;
  sessionId?: string;
}

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class SAPError extends AppError {
  constructor(message: string, public sapErrorCode?: string) {
    super(message, 'SAP_ERROR', 502);
  }
}

export class OpenAIError extends AppError {
  constructor(message: string) {
    super(message, 'OPENAI_ERROR', 503);
  }
}

