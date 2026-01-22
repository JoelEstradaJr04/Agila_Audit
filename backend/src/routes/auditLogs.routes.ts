// ============================================================================
// AUDIT LOGS ROUTES (Unified - Role-Based Filtering)
// ============================================================================

import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import {
  validateApiKeyMiddleware,
  requireWritePermission,
} from '../middlewares/apiKey.middleware';
import {
  enforceRoleAccess,
  requireSuperAdmin,
} from '../middlewares/roleAccess.middleware';
import { asyncHandler } from '../middlewares/errorHandler.middleware';
import {
  readRateLimiter,
  writeRateLimiter,
} from '../middlewares/rateLimit.middleware';
import {
  createAuditLogHandler,
  getAuditLogsHandler,
  getAuditLogByIdHandler,
  deleteAuditLogHandler,
  getAuditLogStatsHandler,
  searchAuditLogsHandler,
  getEntityHistoryHandler,
} from '../controllers/auditLogs.controller';

const router = Router();

// ============================================================================
// UNIFIED AUDIT LOGS ENDPOINTS
// All endpoints apply role-based filtering:
// - SuperAdmin: sees all audit logs
// - Department Admin: sees logs within their department (action_from)
// - Staff/User: sees only their own logs (action_by)
// ============================================================================

/**
 * Create new audit log (requires valid API key with write permission)
 * POST /api/audit-logs
 */
router.post(
  '/',
  writeRateLimiter,
  requireWritePermission,
  asyncHandler(createAuditLogHandler)
);

/**
 * Get audit logs with filters (requires JWT and role-based access)
 * GET /api/audit-logs
 * Query params: entity_type, entity_id, action_type_code, action_by, dateFrom, dateTo, page, limit, sortBy, sortOrder
 */
router.get(
  '/',
  readRateLimiter,
  authenticateJWT,
  enforceRoleAccess,
  asyncHandler(getAuditLogsHandler)
);

/**
 * Get audit log statistics
 * GET /api/audit-logs/stats
 */
router.get(
  '/stats',
  readRateLimiter,
  authenticateJWT,
  enforceRoleAccess,
  asyncHandler(getAuditLogStatsHandler)
);

/**
 * Search audit logs
 * GET /api/audit-logs/search
 * Query params: q (search term), page, limit
 */
router.get(
  '/search',
  readRateLimiter,
  authenticateJWT,
  enforceRoleAccess,
  asyncHandler(searchAuditLogsHandler)
);

/**
 * Get entity history
 * GET /api/audit-logs/history/:entity_type/:entity_id
 */
router.get(
  '/history/:entity_type/:entity_id',
  readRateLimiter,
  authenticateJWT,
  enforceRoleAccess,
  asyncHandler(getEntityHistoryHandler)
);

/**
 * Get single audit log by ID (requires JWT and role-based access)
 * GET /api/audit-logs/:id
 */
router.get(
  '/:id',
  readRateLimiter,
  authenticateJWT,
  enforceRoleAccess,
  asyncHandler(getAuditLogByIdHandler)
);

/**
 * Delete audit log (SuperAdmin only)
 * DELETE /api/audit-logs/:id
 */
router.delete(
  '/:id',
  writeRateLimiter,
  authenticateJWT,
  requireSuperAdmin,
  asyncHandler(deleteAuditLogHandler)
);

export default router;
