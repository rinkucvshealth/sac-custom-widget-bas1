import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export interface Config {
  sap: {
    host: string;
    port: number;
    client: string;
    username: string;
    password: string;
    protocol: string;
  };
  openai: {
    apiKey: string;
  };
  server: {
    port: number;
    apiKey: string;
    allowedOrigin: string;
  };
  app: {
    nodeEnv: string;
    logLevel: string;
  };
}

function validateConfig(): Config {
  const requiredEnvVars = [
    'SAP_HOST',
    'SAP_PORT',
    'SAP_CLIENT',
    'SAP_USERNAME',
    'SAP_PASSWORD',
    'OPENAI_API_KEY',
    'API_KEY'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const host = process.env['SAP_HOST']!;
  const port = parseInt(process.env['SAP_PORT']!, 10);
  // Use HTTPS for port 44300 (typical SAP HTTPS port) or if host starts with https
  const protocol = (port === 44300 || port === 443 || host.startsWith('https')) ? 'https' : 'http';

  return {
    sap: {
      host,
      port,
      client: process.env['SAP_CLIENT']!,
      username: process.env['SAP_USERNAME']!,
      password: process.env['SAP_PASSWORD']!,
      protocol,
    },
    openai: {
      apiKey: process.env['OPENAI_API_KEY']!,
    },
    server: {
      port: parseInt(process.env['PORT'] || '3001', 10),
      apiKey: process.env['API_KEY']!,
      allowedOrigin: process.env['ALLOWED_ORIGIN'] || '*',
    },
    app: {
      nodeEnv: process.env['NODE_ENV'] || 'development',
      logLevel: process.env['LOG_LEVEL'] || 'info',
    },
  };
}

export const config = validateConfig();

// Construct OData base URL
export const SAP_ODATA_BASE_URL = `${config.sap.protocol}://${config.sap.host}:${config.sap.port}/sap/opu/odata/sap/`;

