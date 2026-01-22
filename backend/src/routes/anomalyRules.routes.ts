// ============================================================================
// ANOMALY RULES ROUTES
// API endpoints for managing configurable detection rules
// ============================================================================

import { Router, Request, Response } from 'express';
import prisma from '../prisma/client';
import { DEFAULT_RULES } from '../types/anomaly';

const router = Router();

// ============================================================================
// RULES ENDPOINTS
// ============================================================================

/**
 * GET /api/anomaly-rules
 * List all anomaly detection rules
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const rules = await prisma.anomaly_rule.findMany({
            orderBy: { rule_code: 'asc' }
        });

        res.json({
            success: true,
            data: rules
        });
    } catch (error: any) {
        console.error('Error fetching rules:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/anomaly-rules/defaults
 * Get default rule configurations (for reference)
 */
router.get('/defaults', async (req: Request, res: Response) => {
    try {
        const defaults = Object.entries(DEFAULT_RULES).map(([code, rule]) => ({
            rule_code: code,
            rule_config: rule.config,
            default_severity: rule.severity
        }));

        res.json({
            success: true,
            data: defaults
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/anomaly-rules/:id
 * Get a single rule by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const rule = await prisma.anomaly_rule.findUnique({
            where: { id: parseInt(id) }
        });

        if (!rule) {
            res.status(404).json({
                success: false,
                error: 'Rule not found'
            });
            return;
        }

        res.json({
            success: true,
            data: rule
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/anomaly-rules
 * Create a new detection rule
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const { rule_code, rule_name, description, rule_config, default_severity, is_active } = req.body;

        // Validate required fields
        if (!rule_code || !rule_name || !rule_config) {
            res.status(400).json({
                success: false,
                error: 'rule_code, rule_name, and rule_config are required'
            });
            return;
        }

        // Validate severity
        const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        if (default_severity && !validSeverities.includes(default_severity)) {
            res.status(400).json({
                success: false,
                error: 'Invalid severity. Must be one of: LOW, MEDIUM, HIGH, CRITICAL'
            });
            return;
        }

        const rule = await prisma.anomaly_rule.create({
            data: {
                rule_code: rule_code.toUpperCase(),
                rule_name,
                description,
                rule_config,
                default_severity: default_severity || 'MEDIUM',
                is_active: is_active ?? true
            }
        });

        res.status(201).json({
            success: true,
            data: rule,
            message: 'Rule created successfully'
        });
    } catch (error: any) {
        console.error('Error creating rule:', error);

        if (error.code === 'P2002') {
            res.status(400).json({
                success: false,
                error: 'Rule code already exists'
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
 * PATCH /api/anomaly-rules/:id
 * Update a detection rule
 */
router.patch('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { rule_name, description, rule_config, default_severity, is_active } = req.body;

        // Validate severity if provided
        if (default_severity) {
            const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
            if (!validSeverities.includes(default_severity)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid severity. Must be one of: LOW, MEDIUM, HIGH, CRITICAL'
                });
                return;
            }
        }

        const rule = await prisma.anomaly_rule.update({
            where: { id: parseInt(id) },
            data: {
                ...(rule_name && { rule_name }),
                ...(description !== undefined && { description }),
                ...(rule_config && { rule_config }),
                ...(default_severity && { default_severity }),
                ...(is_active !== undefined && { is_active })
            }
        });

        res.json({
            success: true,
            data: rule,
            message: 'Rule updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating rule:', error);

        if (error.code === 'P2025') {
            res.status(404).json({
                success: false,
                error: 'Rule not found'
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
 * PATCH /api/anomaly-rules/:id/toggle
 * Toggle rule active status
 */
router.patch('/:id/toggle', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const existingRule = await prisma.anomaly_rule.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingRule) {
            res.status(404).json({
                success: false,
                error: 'Rule not found'
            });
            return;
        }

        const rule = await prisma.anomaly_rule.update({
            where: { id: parseInt(id) },
            data: { is_active: !existingRule.is_active }
        });

        res.json({
            success: true,
            data: rule,
            message: `Rule ${rule.is_active ? 'enabled' : 'disabled'} successfully`
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/anomaly-rules/:id
 * Delete a detection rule
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.anomaly_rule.delete({
            where: { id: parseInt(id) }
        });

        res.json({
            success: true,
            message: 'Rule deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting rule:', error);

        if (error.code === 'P2025') {
            res.status(404).json({
                success: false,
                error: 'Rule not found'
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
 * POST /api/anomaly-rules/seed-defaults
 * Seed default rules into database
 */
router.post('/seed-defaults', async (req: Request, res: Response) => {
    try {
        const defaultRules = [
            {
                rule_code: 'VOLUME_SPIKE',
                rule_name: 'Volume Spike Detection',
                description: 'Detects when a user performs an unusually high number of actions in a short time period.',
                rule_config: DEFAULT_RULES.VOLUME_SPIKE.config,
                default_severity: DEFAULT_RULES.VOLUME_SPIKE.severity
            },
            {
                rule_code: 'OFF_HOURS',
                rule_name: 'Off-Hours Activity Detection',
                description: 'Detects activity outside of configured business hours.',
                rule_config: DEFAULT_RULES.OFF_HOURS.config,
                default_severity: DEFAULT_RULES.OFF_HOURS.severity
            },
            {
                rule_code: 'MASS_DELETE',
                rule_name: 'Mass Delete Detection',
                description: 'Detects bulk delete operations that may indicate data destruction.',
                rule_config: DEFAULT_RULES.MASS_DELETE.config,
                default_severity: DEFAULT_RULES.MASS_DELETE.severity
            },
            {
                rule_code: 'RAPID_UPDATES',
                rule_name: 'Rapid Updates Detection',
                description: 'Detects when the same entity is updated multiple times in quick succession.',
                rule_config: DEFAULT_RULES.RAPID_UPDATES.config,
                default_severity: DEFAULT_RULES.RAPID_UPDATES.severity
            }
        ];

        const results = [];
        for (const rule of defaultRules) {
            try {
                const created = await prisma.anomaly_rule.upsert({
                    where: { rule_code: rule.rule_code },
                    update: {
                        rule_name: rule.rule_name,
                        description: rule.description,
                        rule_config: rule.rule_config,
                        default_severity: rule.default_severity
                    },
                    create: rule
                });
                results.push({ rule_code: rule.rule_code, status: 'success', id: created.id });
            } catch (err: any) {
                results.push({ rule_code: rule.rule_code, status: 'error', error: err.message });
            }
        }

        res.json({
            success: true,
            message: 'Default rules seeded',
            data: results
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
