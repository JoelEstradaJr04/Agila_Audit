// ============================================================================
// SWAGGER/OPENAPI CONFIGURATION - AUDIT LOGS MICROSERVICE
// ============================================================================

import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './env';

/**
 * OpenAPI 3.0 Specification Configuration
 * 
 * This file defines the OpenAPI specification for the Audit Logs Microservice API.
 * It includes security schemes, server configuration, and comprehensive documentation structure.
 */

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Audit Logs Microservice API',
    version: '1.0.0',
    description: `
# Audit Logs Microservice - API Documentation

This is the comprehensive API documentation for the Audit Logs Microservice.
The API provides endpoints for managing audit logs, tracking entity changes, 
and maintaining compliance records across the Financial Transaction Management System.

## Features
- Create and retrieve audit logs
- Track entity change history with versioning
- Role-based access control (SuperAdmin, Department Admin, User)
- API key management for external services
- Search and filter audit logs

## Authentication
- **JWT Bearer Token**: Required for user-facing endpoints
- **API Key**: Required for service-to-service communication (via x-api-key header)

## Roles
- **SuperAdmin**: Full access to all audit logs across all departments
- **Department Admin**: Access to department-specific audit logs
- **User**: Access to own audit logs only

## Base URL
- Development: \`http://localhost:${config.port}\`
- Production: Configure via environment variables
    `,
    contact: {
      name: 'Audit Logs Development Team',
      email: 'audit@ftms.example.com',
    },
    license: {
      name: 'Proprietary',
      url: 'https://ftms.example.com/license',
    },
  },
  servers: [
    {
      url: '',
      description: 'Current server (auto-detected from request)',
    },
  ],
  tags: [
    {
      name: 'Health',
      description: 'Health check endpoints',
    },
    {
      name: 'Audit Logs',
      description: 'Unified audit log endpoints with role-based filtering. SuperAdmin sees all logs, Department Admin sees department logs, Staff/User sees own logs.',
    },
    {
      name: 'API Keys',
      description: 'API key management endpoints (SuperAdmin only)',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token in the format: Bearer {token}',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'API key for service-to-service communication',
      },
    },
    schemas: {
      // ============================================================================
      // Common Response Schemas
      // ============================================================================
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Operation completed successfully',
          },
          data: {
            type: 'object',
            description: 'Response data payload',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'An error occurred',
          },
          error: {
            type: 'string',
            example: 'Detailed error message',
          },
        },
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Data retrieved successfully',
          },
          data: {
            type: 'array',
            items: {
              type: 'object',
            },
          },
          pagination: {
            type: 'object',
            properties: {
              page: {
                type: 'integer',
                example: 1,
              },
              limit: {
                type: 'integer',
                example: 10,
              },
              total: {
                type: 'integer',
                example: 100,
              },
              totalPages: {
                type: 'integer',
                example: 10,
              },
            },
          },
        },
      },

      // ============================================================================
      // Audit Log Schemas
      // ============================================================================
      AuditLog: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          entity_type: {
            type: 'string',
            example: 'purchase_request',
            description: 'Type of entity being audited',
          },
          entity_id: {
            type: 'string',
            example: 'PR-2026-001',
            description: 'Unique identifier of the entity',
          },
          action_type_id: {
            type: 'integer',
            example: 1,
            description: 'FK to action_type table',
          },
          action_type: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                example: 1,
              },
              code: {
                type: 'string',
                example: 'CREATE',
              },
            },
          },
          action_by: {
            type: 'string',
            example: 'user-123',
            description: 'User ID who performed the action',
          },
          action_at: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-22T10:30:00Z',
          },
          previous_data: {
            type: 'object',
            nullable: true,
            description: 'Previous state of the entity (for UPDATE/DELETE actions)',
            example: { status: 'DRAFT', amount: 5000 },
          },
          new_data: {
            type: 'object',
            nullable: true,
            description: 'New state of the entity (for CREATE/UPDATE actions)',
            example: { status: 'SUBMITTED', amount: 7500 },
          },
          version: {
            type: 'integer',
            example: 1,
            description: 'Version number (increments on updates)',
          },
          ip_address: {
            type: 'string',
            nullable: true,
            example: '192.168.1.100',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-22T10:30:00Z',
          },
        },
      },
      CreateAuditLog: {
        type: 'object',
        required: ['entity_type', 'entity_id', 'action_type_code'],
        properties: {
          entity_type: {
            type: 'string',
            example: 'purchase_request',
            description: 'Type of entity being audited (e.g., purchase_request, budget, user)',
          },
          entity_id: {
            type: 'string',
            example: 'PR-2026-001',
            description: 'Unique identifier of the entity',
          },
          action_type_code: {
            type: 'string',
            enum: ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SUBMIT', 'EXPORT', 'IMPORT', 'LOGIN', 'LOGOUT'],
            example: 'CREATE',
            description: 'Action type code from action_type table',
          },
          action_by: {
            type: 'string',
            example: 'user-123',
            description: 'User ID who performed the action (optional)',
          },
          previous_data: {
            type: 'object',
            nullable: true,
            description: 'Previous state (required for UPDATE/DELETE, not allowed for CREATE)',
            example: { status: 'DRAFT' },
          },
          new_data: {
            type: 'object',
            nullable: true,
            description: 'New state (required for CREATE/UPDATE, not allowed for DELETE)',
            example: { status: 'SUBMITTED' },
          },
          ip_address: {
            type: 'string',
            nullable: true,
            example: '192.168.1.100',
            description: 'Client IP address (optional)',
          },
        },
      },
      AuditLogStats: {
        type: 'object',
        properties: {
          totalLogs: {
            type: 'integer',
            example: 1250,
          },
          byActionType: {
            type: 'object',
            additionalProperties: {
              type: 'integer',
            },
            example: {
              CREATE: 450,
              UPDATE: 600,
              DELETE: 100,
              APPROVE: 100,
            },
          },
          byEntityType: {
            type: 'object',
            additionalProperties: {
              type: 'integer',
            },
            example: {
              purchase_request: 500,
              budget: 300,
              user: 450,
            },
          },
          recentActivity: {
            type: 'integer',
            example: 25,
            description: 'Number of logs in the last 24 hours',
          },
        },
      },

      // ============================================================================
      // API Key Schemas
      // ============================================================================
      ApiKey: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          serviceName: {
            type: 'string',
            example: 'finance',
          },
          canWrite: {
            type: 'boolean',
            example: true,
          },
          canRead: {
            type: 'boolean',
            example: true,
          },
          isActive: {
            type: 'boolean',
            example: true,
          },
          createdBy: {
            type: 'string',
            example: 'admin',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-22T10:30:00Z',
          },
        },
      },
      CreateApiKey: {
        type: 'object',
        required: ['serviceName'],
        properties: {
          serviceName: {
            type: 'string',
            enum: ['finance', 'hr', 'inventory', 'operations'],
            example: 'finance',
            description: 'Name of the service requesting the API key',
          },
          canWrite: {
            type: 'boolean',
            example: true,
            default: true,
            description: 'Whether the key can create audit logs',
          },
          canRead: {
            type: 'boolean',
            example: true,
            default: true,
            description: 'Whether the key can read audit logs',
          },
        },
      },
      CreatedApiKeyResponse: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          serviceName: {
            type: 'string',
            example: 'finance',
          },
          rawKey: {
            type: 'string',
            example: 'ak_finance_abc123xyz789',
            description: 'The raw API key - save this securely, it will not be shown again',
          },
          warning: {
            type: 'string',
            example: 'Save this key securely. It will not be shown again.',
          },
        },
      },
      ValidateApiKey: {
        type: 'object',
        required: ['apiKey'],
        properties: {
          apiKey: {
            type: 'string',
            example: 'ak_finance_abc123xyz789',
            description: 'The API key to validate',
          },
        },
      },

      // ============================================================================
      // Health Check Schema
      // ============================================================================
      HealthCheck: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          service: {
            type: 'string',
            example: 'audit-logs-microservice',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-22T10:30:00Z',
          },
          uptime: {
            type: 'number',
            example: 3600.5,
            description: 'Server uptime in seconds',
          },
          environment: {
            type: 'string',
            example: 'development',
          },
        },
      },
    },
    responses: {
      Success: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/SuccessResponse',
            },
          },
        },
      },
      BadRequest: {
        description: 'Bad request - Invalid input parameters',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
          },
        },
      },
      Unauthorized: {
        description: 'Unauthorized - Authentication required',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: false,
                },
                message: {
                  type: 'string',
                  example: 'Unauthorized - Invalid or missing token',
                },
              },
            },
          },
        },
      },
      Forbidden: {
        description: 'Forbidden - Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: false,
                },
                message: {
                  type: 'string',
                  example: 'Forbidden - Insufficient permissions',
                },
              },
            },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: false,
                },
                message: {
                  type: 'string',
                  example: 'Resource not found',
                },
              },
            },
          },
        },
      },
      ServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
          },
        },
      },
    },
  },
  // Global security requirement (can be overridden per endpoint)
  security: [],
};

/**
 * Swagger JSDoc Options
 * Defines where to look for API documentation
 */
const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  // Path to the API routes where JSDoc comments are located
  apis: [
    './src/routes/**/*.ts',
    './src/controllers/**/*.ts',
    './src/docs/**/*.ts',
  ],
};

/**
 * Generate OpenAPI specification
 */
export const swaggerSpec = swaggerJsdoc(options);

/**
 * Export configuration for use in other modules
 */
export const swaggerConfig = {
  definition: swaggerDefinition,
  options,
};
