// ============================================================================
// ANOMALY DETECTION ROUTES
// API endpoints for anomaly alerts and detection
// ============================================================================

import { Router, Request, Response } from 'express';
import {
    getAnomalyAlerts,
    getAnomalyAlertById,
    resolveAnomaly,
    getAnomalyStats,
    checkForAnomalies
} from '../services/anomalyDetection.service';

const router = Router();

// ============================================================================
// ANOMALY ALERTS ENDPOINTS
// ============================================================================

/**
 * GET /api/anomalies
 * Get all anomaly alerts with optional filters
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const {
            severity,
            anomaly_type,
            is_resolved,
            page = '1',
            limit = '10',
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        const result = await getAnomalyAlerts({
            severity: severity as string | undefined,
            anomaly_type: anomaly_type as string | undefined,
            is_resolved: is_resolved === 'true' ? true : is_resolved === 'false' ? false : undefined,
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            sortBy: sortBy as string,
            sortOrder: sortOrder as 'asc' | 'desc'
        });

        res.json({
            success: true,
            data: result.alerts,
            pagination: result.pagination
        });
    } catch (error: any) {
        console.error('Error fetching anomalies:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/anomalies/stats
 * Get anomaly statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const stats = await getAnomalyStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error: any) {
        console.error('Error fetching anomaly stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/anomalies/:id
 * Get a single anomaly by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const anomaly = await getAnomalyAlertById(parseInt(id));

        if (!anomaly) {
            res.status(404).json({
                success: false,
                error: 'Anomaly not found'
            });
            return;
        }

        res.json({
            success: true,
            data: anomaly
        });
    } catch (error: any) {
        console.error('Error fetching anomaly:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PATCH /api/anomalies/:id/resolve
 * Mark an anomaly as resolved
 */
router.patch('/:id/resolve', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { resolution_note } = req.body;
        const user = (req as any).user;

        const anomaly = await resolveAnomaly(
            parseInt(id),
            user?.id || user?.sub || 'SYSTEM',
            resolution_note
        );

        res.json({
            success: true,
            data: anomaly,
            message: 'Anomaly marked as resolved'
        });
    } catch (error: any) {
        console.error('Error resolving anomaly:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/anomalies/check/:auditLogId
 * Manually trigger anomaly check for an audit log
 * (Useful for testing or re-checking)
 */
router.post('/check/:auditLogId', async (req: Request, res: Response) => {
    try {
        const { auditLogId } = req.params;
        const detectedAnomalies = await checkForAnomalies(parseInt(auditLogId));

        res.json({
            success: true,
            data: {
                auditLogId: parseInt(auditLogId),
                anomaliesDetected: detectedAnomalies.length,
                anomalies: detectedAnomalies
            }
        });
    } catch (error: any) {
        console.error('Error checking for anomalies:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
