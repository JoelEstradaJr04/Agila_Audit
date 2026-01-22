// ============================================================================
// ENVIRONMENT CONFIGURATION - AUDIT LOGS MICROSERVICE
// ============================================================================

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface Config {
  // Server
  port: number;
  nodeEnv: string;
  serviceName: string;

  // Database
  databaseUrl: string;

  // JWT
  jwtSecret: string;

  // CORS
  corsOrigins: string[];

  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMax: number;

  // API Documentation
  enableApiDocs: boolean;
  apiDocsPath: string;
}

export const config: Config = {
  port: parseInt(process.env.PORT || '4002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: process.env.SERVICE_NAME || 'audit-logs-microservice',

  databaseUrl: process.env.DATABASE_URL || '',

  jwtSecret: process.env.JWT_SECRET || 'audit-default-secret',

  corsOrigins: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:4003'],

  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),

  enableApiDocs: process.env.ENABLE_API_DOCS === 'true',
  apiDocsPath: process.env.API_DOCS_PATH || '/docs',
};

export default config;
