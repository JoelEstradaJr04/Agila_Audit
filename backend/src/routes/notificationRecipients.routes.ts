// ============================================================================
// NOTIFICATION RECIPIENTS ROUTES
// API endpoints for managing admin email recipients
// ============================================================================

import { Router, Request, Response } from 'express';
import {
    getAllRecipients,
    getRecipientById,
    addRecipient,
    updateRecipient,
    deleteRecipient,
    toggleRecipientStatus
} from '../services/notificationRecipients.service';
import { testEmailConfiguration } from '../services/email.service';

const router = Router();

// ============================================================================
// RECIPIENTS CRUD ENDPOINTS
// ============================================================================

/**
 * GET /api/notification-recipients
 * List all notification recipients
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const recipients = await getAllRecipients();
        res.json({
            success: true,
            data: recipients
        });
    } catch (error: any) {
        console.error('Error fetching recipients:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/notification-recipients/:id
 * Get a single recipient by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const recipient = await getRecipientById(parseInt(id));

        if (!recipient) {
            res.status(404).json({
                success: false,
                error: 'Recipient not found'
            });
            return;
        }

        res.json({
            success: true,
            data: recipient
        });
    } catch (error: any) {
        console.error('Error fetching recipient:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/notification-recipients
 * Add a new notification recipient
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const { email, name, role, department, notify_low, notify_medium, notify_high, notify_critical } = req.body;
        const user = (req as any).user;

        // Validate required fields
        if (!email || !name) {
            res.status(400).json({
                success: false,
                error: 'Email and name are required'
            });
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
            return;
        }

        const recipient = await addRecipient({
            email,
            name,
            role,
            department,
            notify_low,
            notify_medium,
            notify_high,
            notify_critical,
            created_by: user?.id || user?.sub || 'SYSTEM'
        });

        res.status(201).json({
            success: true,
            data: recipient,
            message: 'Recipient added successfully'
        });
    } catch (error: any) {
        console.error('Error adding recipient:', error);

        // Handle unique constraint violation
        if (error.code === 'P2002') {
            res.status(400).json({
                success: false,
                error: 'Email already exists'
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PATCH /api/notification-recipients/:id
 * Update a notification recipient
 */
router.patch('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Validate email format if provided
        if (updateData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(updateData.email)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid email format'
                });
                return;
            }
        }

        const recipient = await updateRecipient(parseInt(id), updateData);
        res.json({
            success: true,
            data: recipient,
            message: 'Recipient updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating recipient:', error);

        if (error.code === 'P2002') {
            res.status(400).json({
                success: false,
                error: 'Email already exists'
            });
            return;
        }

        if (error.code === 'P2025') {
            res.status(404).json({
                success: false,
                error: 'Recipient not found'
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/notification-recipients/:id
 * Delete a notification recipient
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await deleteRecipient(parseInt(id));

        res.json({
            success: true,
            message: 'Recipient deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting recipient:', error);

        if (error.code === 'P2025') {
            res.status(404).json({
                success: false,
                error: 'Recipient not found'
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PATCH /api/notification-recipients/:id/toggle
 * Toggle recipient active status
 */
router.patch('/:id/toggle', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const recipient = await toggleRecipientStatus(parseInt(id));

        res.json({
            success: true,
            data: recipient,
            message: `Recipient ${recipient.is_active ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error: any) {
        console.error('Error toggling recipient status:', error);

        if (error.message === 'Recipient not found') {
            res.status(404).json({
                success: false,
                error: 'Recipient not found'
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================================================
// EMAIL CONFIGURATION TEST
// ============================================================================

/**
 * GET /api/notification-recipients/test-email
 * Test email configuration
 */
router.get('/test-email', async (req: Request, res: Response) => {
    try {
        const result = await testEmailConfiguration();
        res.json({
            success: result.success,
            message: result.message
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
