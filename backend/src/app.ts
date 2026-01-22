// ============================================================================
// AUDIT LOGS MICROSERVICE - MAIN APPLICATION
// ============================================================================

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware';
import { apiRateLimiter } from './middlewares/rateLimit.middleware';
import { setupSwagger, addDocsInfoToHealth, validateSwaggerSpec } from './middlewares/swagger.middleware';
import { config } from './config/env';

// Import routes
import apiKeysRoutes from './routes/apiKeys.routes';
import auditLogsRoutes from './routes/auditLogs.routes';

const app: Application = express();

// Trust proxy - required for correct protocol detection behind Railway/reverse proxies
// This ensures req.protocol returns 'https' when behind a proxy that terminates SSL
app.set('trust proxy', true);

// Validate Swagger specification on startup (if enabled)
if (config.enableApiDocs) {
  validateSwaggerSpec();
}

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// Security headers
app.use(helmet());

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:4003'];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Global rate limiting
app.use('/api', apiRateLimiter);

// ============================================================================
// SWAGGER/OPENAPI DOCUMENTATION
// ============================================================================

// Setup Swagger/OpenAPI documentation (if enabled)
setupSwagger(app);

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', addDocsInfoToHealth, (req, res) => {
  const response: any = {
    success: true,
    service: config.serviceName,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  };

  // Add API documentation links if enabled
  if (res.locals.docsInfo?.enabled) {
    response.documentation = {
      swagger_ui: res.locals.docsInfo.path,
      openapi_spec: res.locals.docsInfo.openApiSpec,
    };
  }

  res.json(response);
});

// ============================================================================
// API ROUTES
// ============================================================================

// Unified audit logs routes (with role-based filtering)
app.use('/api/audit-logs', auditLogsRoutes);

// API keys management (SuperAdmin only)
app.use('/api/keys', apiKeysRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================================================
// EXPORT
// ============================================================================

export default app;
