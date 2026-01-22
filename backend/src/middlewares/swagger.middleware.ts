// ============================================================================
// SWAGGER MIDDLEWARE - AUDIT LOGS MICROSERVICE
// ============================================================================

import { Request, Response, NextFunction, Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger';
import { config } from '../config/env';

/**
 * Swagger Middleware Configuration
 * 
 * Configures and sets up Swagger UI with security and environment-based access control.
 * Only exposes Swagger UI when ENABLE_API_DOCS environment variable is set to true.
 */

/**
 * Custom Swagger UI options
 * Configures the appearance and behavior of Swagger UI
 */
const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    syntaxHighlight: {
      activate: true,
      theme: 'monokai',
    },
    tryItOutEnabled: true,
    requestSnippetsEnabled: true,
    defaultModelsExpandDepth: 3,
    defaultModelExpandDepth: 3,
    docExpansion: 'list',
    operationsSorter: 'alpha',
    tagsSorter: 'alpha',
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .scheme-container { 
      background: #fafafa; 
      padding: 20px; 
      border-radius: 4px;
      margin: 20px 0;
    }
  `,
  customSiteTitle: 'Audit Logs API Documentation',
  customfavIcon: '/favicon.ico',
};

/**
 * Setup Swagger documentation endpoints
 * 
 * This function conditionally sets up Swagger UI and related endpoints
 * based on the ENABLE_API_DOCS environment variable.
 * 
 * @param app - Express application instance
 */
export const setupSwagger = (app: Application): void => {
  const enableApiDocs = config.enableApiDocs;
  const apiDocsPath = config.apiDocsPath;

  if (!enableApiDocs) {
    // Add a handler to return 404 for docs endpoints when disabled
    app.get([apiDocsPath, `${apiDocsPath}/*`, '/api-docs.json'], (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'API documentation is not available in this environment',
        hint: 'Set ENABLE_API_DOCS=true to enable documentation',
      });
    });
    
    return;
  }

  try {
    // Serve OpenAPI JSON specification
    app.get('/api-docs.json', (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      
      // Dynamically set the server URL based on the request
      const protocol = req.protocol;
      const host = req.get('host');
      const serverUrl = `${protocol}://${host}`;
      
      // Clone the spec and update the server URL
      const dynamicSpec = {
        ...swaggerSpec,
        servers: [
          {
            url: serverUrl,
            description: 'Current server (auto-detected)',
          },
        ],
      };
      
      res.send(dynamicSpec);
    });

    // Serve Swagger UI with dynamic server URL
    app.use(
      apiDocsPath,
      (req: Request, res: Response, next: NextFunction) => {
        // Dynamically set the server URL for each request
        const protocol = req.protocol;
        const host = req.get('host');
        const serverUrl = `${protocol}://${host}`;
        
        // Update swagger spec with current server URL
        (req as any).swaggerDoc = {
          ...swaggerSpec,
          servers: [
            {
              url: serverUrl,
              description: 'Current server (auto-detected)',
            },
          ],
        };
        next();
      },
      swaggerUi.serve,
      (req: Request, res: Response) => {
        res.send(
          swaggerUi.generateHTML((req as any).swaggerDoc || swaggerSpec, swaggerUiOptions)
        );
      }
    );

    // Add redirect from /docs to configured path if different
    if (apiDocsPath !== '/docs') {
      app.get('/docs', (req: Request, res: Response) => {
        res.redirect(apiDocsPath);
      });
    }
  } catch (error) {
    console.error('[Audit Service] Swagger setup failed:', error);
    throw error;
  }
};

/**
 * Middleware to add API documentation links to health check
 */
export const addDocsInfoToHealth = (req: Request, res: Response, next: NextFunction): void => {
  res.locals.docsInfo = {
    enabled: config.enableApiDocs,
    path: config.enableApiDocs ? config.apiDocsPath : null,
    openApiSpec: config.enableApiDocs ? '/api-docs.json' : null,
  };

  next();
};

/**
 * Validate Swagger specification on startup
 */
export const validateSwaggerSpec = (): boolean => {
  try {
    if (!swaggerSpec || typeof swaggerSpec !== 'object') {
      throw new Error('Invalid Swagger specification');
    }

    const spec = swaggerSpec as any;

    if (!spec.openapi) {
      throw new Error('Missing OpenAPI version in specification');
    }

    if (!spec.info) {
      throw new Error('Missing info section in specification');
    }

    // Silent success - only log on failure
    return true;
  } catch (error) {
    console.error('[Audit Service] Swagger validation failed:', error);
    return false;
  }
};
