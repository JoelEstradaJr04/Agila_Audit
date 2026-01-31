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
    {
      name: 'Anomalies',
      description: 'Anomaly detection alerts and management. View detected anomalies, resolve alerts, and manually trigger checks.',
    },
    {
      name: 'Anomaly Rules',
      description: 'Manage configurable anomaly detection rules. Create, update, toggle, and delete rules that control how anomalies are detected.',
    },
    {
      name: 'Notification Recipients',
      description: 'Manage email notification recipients for anomaly alerts. Configure who receives alerts based on severity levels.',
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

      // ============================================================================
      // Anomaly Detection Schemas
      // ============================================================================
      AnomalyAlert: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          audit_log_id: {
            type: 'integer',
            example: 123,
          },
          anomaly_type: {
            type: 'string',
            enum: ['VOLUME_SPIKE', 'OFF_HOURS', 'MASS_DELETE', 'RAPID_UPDATES'],
            example: 'VOLUME_SPIKE',
          },
          severity: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            example: 'HIGH',
          },
          description: {
            type: 'string',
            example: 'User performed 75 actions within 60 minutes (threshold: 50)',
          },
          detected_at: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-22T10:30:00Z',
          },
          is_resolved: {
            type: 'boolean',
            example: false,
          },
          resolved_by: {
            type: 'string',
            nullable: true,
            example: 'admin-001',
          },
          resolved_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          resolution_note: {
            type: 'string',
            nullable: true,
            example: 'Verified as authorized bulk operation',
          },
          metadata: {
            type: 'object',
            description: 'Additional context about the anomaly',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-22T10:30:00Z',
          },
        },
      },
      AnomalyStats: {
        type: 'object',
        properties: {
          total: {
            type: 'integer',
            example: 150,
          },
          unresolved: {
            type: 'integer',
            example: 25,
          },
          bySeverity: {
            type: 'object',
            additionalProperties: {
              type: 'integer',
            },
            example: {
              LOW: 50,
              MEDIUM: 60,
              HIGH: 30,
              CRITICAL: 10,
            },
          },
          byType: {
            type: 'object',
            additionalProperties: {
              type: 'integer',
            },
            example: {
              VOLUME_SPIKE: 40,
              OFF_HOURS: 35,
              MASS_DELETE: 25,
              RAPID_UPDATES: 50,
            },
          },
          recentActivity: {
            type: 'integer',
            example: 12,
            description: 'Anomalies detected in last 24 hours',
          },
        },
      },

      // ============================================================================
      // Anomaly Rules Schemas
      // ============================================================================
      AnomalyRule: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          rule_code: {
            type: 'string',
            example: 'VOLUME_SPIKE',
          },
          rule_name: {
            type: 'string',
            example: 'Volume Spike Detection',
          },
          description: {
            type: 'string',
            nullable: true,
            example: 'Detects when a user performs an unusually high number of actions in a short time period',
          },
          rule_config: {
            type: 'object',
            description: 'Rule-specific configuration parameters',
            example: {
              threshold: 50,
              time_window_minutes: 60,
            },
          },
          default_severity: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            example: 'HIGH',
          },
          is_active: {
            type: 'boolean',
            example: true,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-22T10:30:00Z',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-22T10:30:00Z',
          },
        },
      },
      CreateAnomalyRule: {
        type: 'object',
        required: ['rule_code', 'rule_name', 'rule_config'],
        properties: {
          rule_code: {
            type: 'string',
            example: 'CUSTOM_RULE',
            description: 'Unique identifier code for the rule (will be uppercased)',
          },
          rule_name: {
            type: 'string',
            example: 'Custom Detection Rule',
            description: 'Human-readable name for the rule',
          },
          description: {
            type: 'string',
            nullable: true,
            example: 'Detects custom anomaly patterns',
          },
          rule_config: {
            type: 'object',
            description: 'Configuration parameters specific to this rule',
            example: {
              threshold: 10,
              time_window_minutes: 30,
            },
          },
          default_severity: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            default: 'MEDIUM',
            example: 'MEDIUM',
          },
          is_active: {
            type: 'boolean',
            default: true,
            example: true,
          },
        },
      },
      UpdateAnomalyRule: {
        type: 'object',
        properties: {
          rule_name: {
            type: 'string',
            example: 'Updated Rule Name',
          },
          description: {
            type: 'string',
            nullable: true,
          },
          rule_config: {
            type: 'object',
            example: {
              threshold: 100,
            },
          },
          default_severity: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            example: 'HIGH',
          },
          is_active: {
            type: 'boolean',
            example: true,
          },
        },
      },

      // ============================================================================
      // Notification Recipients Schemas
      // ============================================================================
      NotificationRecipient: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'admin@example.com',
          },
          name: {
            type: 'string',
            example: 'System Administrator',
          },
          role: {
            type: 'string',
            nullable: true,
            example: 'Admin',
          },
          department: {
            type: 'string',
            nullable: true,
            example: 'IT',
          },
          is_active: {
            type: 'boolean',
            example: true,
          },
          notify_low: {
            type: 'boolean',
            example: false,
            description: 'Receive notifications for LOW severity anomalies',
          },
          notify_medium: {
            type: 'boolean',
            example: true,
            description: 'Receive notifications for MEDIUM severity anomalies',
          },
          notify_high: {
            type: 'boolean',
            example: true,
            description: 'Receive notifications for HIGH severity anomalies',
          },
          notify_critical: {
            type: 'boolean',
            example: true,
            description: 'Receive notifications for CRITICAL severity anomalies',
          },
          created_by: {
            type: 'string',
            nullable: true,
            example: 'admin-001',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-22T10:30:00Z',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-22T10:30:00Z',
          },
        },
      },
      CreateNotificationRecipient: {
        type: 'object',
        required: ['email', 'name'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'admin@example.com',
            description: 'Email address for notifications',
          },
          name: {
            type: 'string',
            example: 'System Administrator',
            description: 'Display name of the recipient',
          },
          role: {
            type: 'string',
            nullable: true,
            example: 'Admin',
            description: 'Role or job title',
          },
          department: {
            type: 'string',
            nullable: true,
            example: 'IT',
            description: 'Department name',
          },
          notify_low: {
            type: 'boolean',
            default: false,
            example: false,
            description: 'Receive LOW severity notifications',
          },
          notify_medium: {
            type: 'boolean',
            default: true,
            example: true,
            description: 'Receive MEDIUM severity notifications',
          },
          notify_high: {
            type: 'boolean',
            default: true,
            example: true,
            description: 'Receive HIGH severity notifications',
          },
          notify_critical: {
            type: 'boolean',
            default: true,
            example: true,
            description: 'Receive CRITICAL severity notifications',
          },
        },
      },
      UpdateNotificationRecipient: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'updated@example.com',
          },
          name: {
            type: 'string',
            example: 'Updated Name',
          },
          role: {
            type: 'string',
            nullable: true,
          },
          department: {
            type: 'string',
            nullable: true,
          },
          is_active: {
            type: 'boolean',
          },
          notify_low: {
            type: 'boolean',
          },
          notify_medium: {
            type: 'boolean',
          },
          notify_high: {
            type: 'boolean',
          },
          notify_critical: {
            type: 'boolean',
          },
        },
      },

      // ============================================================================
      // Pagination Schema
      // ============================================================================
      Pagination: {
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
