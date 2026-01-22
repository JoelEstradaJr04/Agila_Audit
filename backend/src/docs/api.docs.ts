// ============================================================================
// API DOCUMENTATION - AUDIT LOGS MICROSERVICE (Unified Endpoints)
// ============================================================================
// This file contains comprehensive JSDoc/Swagger annotations for all API endpoints.
// All audit log endpoints use role-based filtering:
// - SuperAdmin: sees all audit logs
// - Department Admin: sees logs within their department (action_from)
// - Staff/User: sees only their own logs (action_by)

/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: System health check
 *     description: Returns the health status of the Audit Logs Microservice including uptime and environment information.
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *             example:
 *               success: true
 *               service: audit-logs-microservice
 *               timestamp: '2026-01-22T10:30:00Z'
 *               uptime: 3600.5
 *               environment: development
 */

// ============================================================================
// AUDIT LOGS ENDPOINTS (Unified with Role-Based Filtering)
// ============================================================================

/**
 * @swagger
 * /api/audit-logs:
 *   post:
 *     tags:
 *       - Audit Logs
 *     summary: Create a new audit log entry
 *     description: |
 *       Creates a new audit log entry. Requires a valid API key with write permission.
 *       
 *       **Action Type Rules:**
 *       - CREATE: `new_data` required, `previous_data` must be null
 *       - UPDATE: Both `new_data` and `previous_data` required
 *       - DELETE: `previous_data` required, `new_data` must be null
 *       - APPROVE/REJECT/SUBMIT: Optional data fields
 *       - LOGIN/LOGOUT: Optional `ip_address`
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAuditLog'
 *           examples:
 *             create:
 *               summary: Create action
 *               value:
 *                 entity_type: purchase_request
 *                 entity_id: PR-2026-001
 *                 action_type_code: CREATE
 *                 action_by: user-123
 *                 action_from: Finance
 *                 new_data:
 *                   status: DRAFT
 *                   amount: 5000
 *                   requester: John Doe
 *             update:
 *               summary: Update action
 *               value:
 *                 entity_type: purchase_request
 *                 entity_id: PR-2026-001
 *                 action_type_code: UPDATE
 *                 action_by: user-123
 *                 action_from: Finance
 *                 previous_data:
 *                   status: DRAFT
 *                   amount: 5000
 *                 new_data:
 *                   status: SUBMITTED
 *                   amount: 7500
 *             delete:
 *               summary: Delete action
 *               value:
 *                 entity_type: purchase_request
 *                 entity_id: PR-2026-001
 *                 action_type_code: DELETE
 *                 action_by: admin-456
 *                 action_from: Finance
 *                 previous_data:
 *                   status: SUBMITTED
 *                   amount: 7500
 *     responses:
 *       201:
 *         description: Audit log created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Audit log created successfully
 *                 data:
 *                   $ref: '#/components/schemas/AuditLog'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   get:
 *     tags:
 *       - Audit Logs
 *     summary: Get audit logs with filters (role-based)
 *     description: |
 *       Retrieves audit logs with optional filters. Results are automatically filtered based on user role:
 *       - **SuperAdmin:** Access to all logs
 *       - **Department Admin:** Access to department-specific logs (filtered by action_from)
 *       - **Staff/User:** Access to own logs only (filtered by action_by)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entity_type
 *         schema:
 *           type: string
 *         description: Filter by entity type (e.g., purchase_request, budget)
 *         example: purchase_request
 *       - in: query
 *         name: entity_id
 *         schema:
 *           type: string
 *         description: Filter by specific entity ID
 *         example: PR-2026-001
 *       - in: query
 *         name: action_type_code
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE, APPROVE, REJECT, SUBMIT, EXPORT, IMPORT, LOGIN, LOGOUT]
 *         description: Filter by action type
 *       - in: query
 *         name: action_by
 *         schema:
 *           type: string
 *         description: Filter by user who performed the action
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *         example: '2026-01-01'
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *         example: '2026-01-31'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Number of records per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: action_at
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Audit logs retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLogBrief'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 150
 *                     totalPages:
 *                       type: integer
 *                       example: 15
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/audit-logs/stats:
 *   get:
 *     tags:
 *       - Audit Logs
 *     summary: Get audit log statistics (role-based)
 *     description: |
 *       Returns aggregate statistics about audit logs including counts by action type and entity type.
 *       Results are filtered based on user role.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Statistics retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/AuditLogStats'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/audit-logs/search:
 *   get:
 *     tags:
 *       - Audit Logs
 *     summary: Search audit logs (role-based)
 *     description: |
 *       Full-text search across audit logs. Searches entity types, entity IDs, and action_by fields.
 *       Results are filtered based on user role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *         example: purchase_request
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Records per page
 *     responses:
 *       200:
 *         description: Search completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       400:
 *         description: Search term is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/audit-logs/history/{entity_type}/{entity_id}:
 *   get:
 *     tags:
 *       - Audit Logs
 *     summary: Get entity history (role-based)
 *     description: |
 *       Retrieves the complete audit history for a specific entity, ordered by version.
 *       Results are filtered based on user role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entity_type
 *         required: true
 *         schema:
 *           type: string
 *         description: Type of entity
 *         example: purchase_request
 *       - in: path
 *         name: entity_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity ID
 *         example: PR-2026-001
 *     responses:
 *       200:
 *         description: Entity history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Entity history retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLog'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/audit-logs/{id}:
 *   get:
 *     tags:
 *       - Audit Logs
 *     summary: Get audit log by ID (role-based)
 *     description: |
 *       Retrieves a single audit log entry by its ID.
 *       Access is filtered based on user role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Audit log ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Audit log retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Audit log retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/AuditLog'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   delete:
 *     tags:
 *       - Audit Logs
 *     summary: Delete audit log (SuperAdmin only)
 *     description: Permanently deletes an audit log entry. This action cannot be undone. **SuperAdmin access required.**
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Audit log ID to delete
 *         example: 1
 *     responses:
 *       200:
 *         description: Audit log deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Audit log deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// ============================================================================
// API KEYS ENDPOINTS (SuperAdmin only)
// ============================================================================

/**
 * @swagger
 * /api/keys:
 *   get:
 *     tags:
 *       - API Keys
 *     summary: List all API keys
 *     description: Retrieves all API keys. **SuperAdmin access required.**
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: API keys retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API keys retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ApiKey'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   post:
 *     tags:
 *       - API Keys
 *     summary: Create a new API key
 *     description: |
 *       Creates a new API key for external service integration.
 *       **SuperAdmin access required.**
 *       
 *       **Important:** The raw API key is only shown once in the response.
 *       Make sure to save it securely.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateApiKey'
 *           example:
 *             serviceName: finance
 *             canWrite: true
 *             canRead: true
 *     responses:
 *       201:
 *         description: API key created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API key created successfully
 *                 data:
 *                   $ref: '#/components/schemas/CreatedApiKeyResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/keys/validate:
 *   post:
 *     tags:
 *       - API Keys
 *     summary: Validate API key
 *     description: Validates an API key and returns its details if valid. Used for internal service authentication.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateApiKey'
 *           example:
 *             apiKey: ak_finance_abc123xyz789
 *     responses:
 *       200:
 *         description: API key is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API key is valid
 *                 data:
 *                   $ref: '#/components/schemas/ApiKey'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid API key
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/keys/{id}:
 *   get:
 *     tags:
 *       - API Keys
 *     summary: Get API key by ID
 *     description: Retrieves API key details (excludes the actual key hash). **SuperAdmin access required.**
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: API key ID
 *     responses:
 *       200:
 *         description: API key retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ApiKey'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   delete:
 *     tags:
 *       - API Keys
 *     summary: Delete API key permanently
 *     description: Permanently deletes an API key. **SuperAdmin access required.**
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: API key ID
 *     responses:
 *       200:
 *         description: API key deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API key deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/keys/{id}/revoke:
 *   patch:
 *     tags:
 *       - API Keys
 *     summary: Revoke API key
 *     description: Revokes an API key making it inactive. The key can potentially be reactivated. **SuperAdmin access required.**
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: API key ID
 *     responses:
 *       200:
 *         description: API key revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API key revoked successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// ============================================================================
// SCHEMAS
// ============================================================================

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token from the main FTMS authentication system
 *     apiKeyAuth:
 *       type: apiKey
 *       in: header
 *       name: x-api-key
 *       description: API key for service-to-service authentication
 *
 *   schemas:
 *     HealthCheck:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         service:
 *           type: string
 *           example: audit-logs-microservice
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: '2026-01-22T10:30:00Z'
 *         uptime:
 *           type: number
 *           example: 3600.5
 *         environment:
 *           type: string
 *           example: development
 *         documentation:
 *           type: object
 *           properties:
 *             swagger_ui:
 *               type: string
 *               example: /docs
 *             openapi_spec:
 *               type: string
 *               example: /docs/openapi.json
 *
 *     CreateAuditLog:
 *       type: object
 *       required:
 *         - entity_type
 *         - entity_id
 *         - action_type_code
 *       properties:
 *         entity_type:
 *           type: string
 *           description: Type of entity being logged (e.g., purchase_request, budget, user)
 *           example: purchase_request
 *         entity_id:
 *           type: string
 *           description: Unique identifier of the entity
 *           example: PR-2026-001
 *         action_type_code:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE, APPROVE, REJECT, SUBMIT, EXPORT, IMPORT, LOGIN, LOGOUT]
 *           description: Action type code
 *           example: CREATE
 *         action_by:
 *           type: string
 *           description: User ID who performed the action
 *           example: user-123
 *         action_from:
 *           type: string
 *           description: Department of the user who performed the action
 *           example: Finance
 *         previous_data:
 *           type: object
 *           description: Previous state of the entity (required for UPDATE and DELETE)
 *           example:
 *             status: DRAFT
 *             amount: 5000
 *         new_data:
 *           type: object
 *           description: New state of the entity (required for CREATE and UPDATE)
 *           example:
 *             status: SUBMITTED
 *             amount: 7500
 *         ip_address:
 *           type: string
 *           description: IP address of the request (optional, used for LOGIN/LOGOUT)
 *           example: 192.168.1.100
 *
 *     AuditLog:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         entity_type:
 *           type: string
 *           example: purchase_request
 *         entity_id:
 *           type: string
 *           example: PR-2026-001
 *         action_type:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             code:
 *               type: string
 *               example: CREATE
 *         action_by:
 *           type: string
 *           nullable: true
 *           example: user-123
 *         action_from:
 *           type: string
 *           nullable: true
 *           description: Department of the user who performed the action
 *           example: Finance
 *         action_at:
 *           type: string
 *           format: date-time
 *           example: '2026-01-22T10:30:00Z'
 *         previous_data:
 *           type: object
 *           nullable: true
 *           example:
 *             status: DRAFT
 *         new_data:
 *           type: object
 *           nullable: true
 *           example:
 *             status: SUBMITTED
 *         version:
 *           type: integer
 *           example: 1
 *         ip_address:
 *           type: string
 *           nullable: true
 *           example: 192.168.1.100
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: '2026-01-22T10:30:00Z'
 *         details:
 *           type: string
 *           description: Human-readable description of the action (computed)
 *           example: User user-123 from Finance created purchase_request PR-2026-001
 *
 *     AuditLogBrief:
 *       type: object
 *       description: Brief version of audit log for list views (excludes previous_data and new_data)
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         entity_type:
 *           type: string
 *           example: purchase_request
 *         entity_id:
 *           type: string
 *           example: PR-2026-001
 *         action_type_id:
 *           type: integer
 *           example: 1
 *         action_type_code:
 *           type: string
 *           example: CREATE
 *         action_by:
 *           type: string
 *           nullable: true
 *           example: user-123
 *         action_from:
 *           type: string
 *           nullable: true
 *           description: Department of the user who performed the action
 *           example: Finance
 *         action_at:
 *           type: string
 *           format: date-time
 *           example: '2026-01-22T10:30:00Z'
 *         version:
 *           type: integer
 *           example: 1
 *         ip_address:
 *           type: string
 *           nullable: true
 *           example: 192.168.1.100
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: '2026-01-22T10:30:00Z'
 *         details:
 *           type: string
 *           description: Human-readable description of the action (computed)
 *           example: User user-123 from Finance created purchase_request PR-2026-001
 *
 *     AuditLogStats:
 *       type: object
 *       properties:
 *         totalLogs:
 *           type: integer
 *           example: 1500
 *         recentActivity:
 *           type: integer
 *           description: Number of logs in the last 24 hours
 *           example: 45
 *         actionBreakdown:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               action_type:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   code:
 *                     type: string
 *               count:
 *                 type: integer
 *           example:
 *             - action_type: { id: 1, code: CREATE }
 *               count: 500
 *             - action_type: { id: 2, code: UPDATE }
 *               count: 800
 *         entityBreakdown:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               entity_type:
 *                 type: string
 *               count:
 *                 type: integer
 *           example:
 *             - entity_type: purchase_request
 *               count: 600
 *             - entity_type: budget
 *               count: 400
 *
 *     PaginatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AuditLog'
 *         meta:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               example: 1
 *             limit:
 *               type: integer
 *               example: 10
 *             total:
 *               type: integer
 *               example: 150
 *             totalPages:
 *               type: integer
 *               example: 15
 *
 *     ApiKey:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         serviceName:
 *           type: string
 *           example: finance
 *         canWrite:
 *           type: boolean
 *           example: true
 *         canRead:
 *           type: boolean
 *           example: true
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdBy:
 *           type: string
 *           example: admin-001
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: '2026-01-22T10:30:00Z'
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: '2026-01-22T10:30:00Z'
 *
 *     CreateApiKey:
 *       type: object
 *       required:
 *         - serviceName
 *       properties:
 *         serviceName:
 *           type: string
 *           description: Name of the service that will use this API key
 *           example: finance
 *         canWrite:
 *           type: boolean
 *           description: Permission to create audit logs
 *           default: true
 *           example: true
 *         canRead:
 *           type: boolean
 *           description: Permission to read audit logs
 *           default: true
 *           example: true
 *
 *     ValidateApiKey:
 *       type: object
 *       required:
 *         - apiKey
 *       properties:
 *         apiKey:
 *           type: string
 *           description: The raw API key to validate
 *           example: ak_finance_abc123xyz789
 *
 *     CreatedApiKeyResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         serviceName:
 *           type: string
 *           example: finance
 *         rawKey:
 *           type: string
 *           description: The raw API key (shown only once)
 *           example: ak_finance_abc123xyz789
 *         canWrite:
 *           type: boolean
 *           example: true
 *         canRead:
 *           type: boolean
 *           example: true
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: An error occurred
 *         error:
 *           type: string
 *           example: Detailed error message
 *
 *   responses:
 *     BadRequest:
 *       description: Bad request - validation error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             message: Validation failed
 *             error: entity_type is required
 *
 *     Unauthorized:
 *       description: Authentication required or invalid credentials
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             message: Authentication required
 *
 *     Forbidden:
 *       description: Access denied - insufficient permissions
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             message: SuperAdmin access required
 *
 *     NotFound:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             message: Audit log not found or access denied
 *
 *     ServerError:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             message: An internal error occurred
 *             error: Database connection failed
 */
