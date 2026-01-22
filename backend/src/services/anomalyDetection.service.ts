// ============================================================================
// ANOMALY DETECTION SERVICE
// Core detection logic for identifying suspicious patterns in audit logs
// ============================================================================

import prisma from '../prisma/client';
import {
    DetectedAnomaly,
    AnomalyType,
    AnomalySeverity,
    DEFAULT_RULES,
    VolumeRuleConfig,
    OffHoursRuleConfig,
    MassDeleteRuleConfig,
    RapidUpdatesRuleConfig
} from '../types/anomaly';
import { analyzeWithLLM } from './llmAnalysis.service';
import { sendAnomalyAlert } from './email.service';
import { getAdminEmails } from './notificationRecipients.service';

/**
 * Get rule configuration from database or use defaults
 */
async function getRuleConfig(ruleCode: string): Promise<{ config: any; severity: AnomalySeverity; isActive: boolean }> {
    try {
        const dbRule = await prisma.anomaly_rule.findUnique({
            where: { rule_code: ruleCode }
        });

        if (dbRule) {
            return {
                config: dbRule.rule_config as any,
                severity: dbRule.default_severity as AnomalySeverity,
                isActive: dbRule.is_active
            };
        }
    } catch (error) {
        console.warn(`⚠️ Could not fetch rule ${ruleCode} from database, using defaults`);
    }

    // Return default if not in database
    const defaultRule = DEFAULT_RULES[ruleCode];
    return {
        config: defaultRule?.config || {},
        severity: defaultRule?.severity || 'MEDIUM',
        isActive: true
    };
}

/**
 * Main function: Check for anomalies after an audit log is created
 * Call this after creating an audit log to trigger anomaly detection
 */
export async function checkForAnomalies(auditLogId: number): Promise<DetectedAnomaly[]> {
    const auditLog = await prisma.audit_log.findUnique({
        where: { id: auditLogId },
        include: { action_type: true }
    });

    if (!auditLog) {
        console.warn(`⚠️ Audit log ${auditLogId} not found`);
        return [];
    }

    const detectedAnomalies: DetectedAnomaly[] = [];

    // Run all detection rules
    console.log(`🔍 Checking audit log #${auditLogId} for anomalies...`);

    // Check Volume Spike
    const volumeAnomaly = await checkVolumeSpike(auditLog);
    if (volumeAnomaly) {
        console.log(`🚨 Volume spike detected for user ${auditLog.action_by}`);
        detectedAnomalies.push(volumeAnomaly);
    }

    // Check Off Hours
    const offHoursAnomaly = await checkOffHours(auditLog);
    if (offHoursAnomaly) {
        console.log(`🚨 Off-hours activity detected at ${auditLog.action_at}`);
        detectedAnomalies.push(offHoursAnomaly);
    }

    // Check Mass Delete
    const massDeleteAnomaly = await checkMassDelete(auditLog);
    if (massDeleteAnomaly) {
        console.log(`🚨 Mass delete detected for user ${auditLog.action_by}`);
        detectedAnomalies.push(massDeleteAnomaly);
    }

    // Check Rapid Updates
    const rapidUpdateAnomaly = await checkRapidUpdates(auditLog);
    if (rapidUpdateAnomaly) {
        console.log(`🚨 Rapid updates detected for entity ${auditLog.entity_type}:${auditLog.entity_id}`);
        detectedAnomalies.push(rapidUpdateAnomaly);
    }

    // Process each detected anomaly
    for (const anomaly of detectedAnomalies) {
        await processAnomaly(anomaly);
    }

    if (detectedAnomalies.length === 0) {
        console.log(`✅ No anomalies detected for audit log #${auditLogId}`);
    } else {
        console.log(`⚠️ ${detectedAnomalies.length} anomaly(s) detected and processed`);
    }

    return detectedAnomalies;
}

/**
 * Process a detected anomaly: get AI analysis, store, and notify
 */
async function processAnomaly(anomaly: DetectedAnomaly): Promise<void> {
    try {
        // Get AI analysis
        console.log(`🤖 Generating AI analysis for ${anomaly.anomalyType}...`);
        const aiAnalysis = await analyzeWithLLM(anomaly);

        // Store anomaly alert
        const alert = await prisma.anomaly_alert.create({
            data: {
                audit_log_id: anomaly.auditLogId,
                anomaly_type: anomaly.anomalyType,
                severity: anomaly.severity,
                ai_explanation: aiAnalysis.explanation,
                ai_risk_score: aiAnalysis.riskScore,
                ai_suggestions: JSON.stringify(aiAnalysis.suggestions),
                context_data: anomaly.contextData
            }
        });

        console.log(`💾 Anomaly alert #${alert.id} stored in database`);

        // Send email notification (recipients filtered by preferences)
        const adminEmails = await getAdminEmails(anomaly.severity);

        if (adminEmails.length > 0) {
            console.log(`📧 Sending email notifications for ${anomaly.severity} severity alert...`);

            try {
                await sendAnomalyAlert(alert, aiAnalysis, adminEmails);

                // Update notification status
                await prisma.anomaly_alert.update({
                    where: { id: alert.id },
                    data: {
                        is_notified: true,
                        notified_at: new Date(),
                        notified_to: adminEmails.map(a => a.email)
                    }
                });

                console.log(`✅ Email sent to ${adminEmails.length} recipient(s)`);
            } catch (emailError) {
                console.error('❌ Failed to send email notification:', emailError);
            }
        } else {
            console.warn('⚠️ No recipients configured for email notifications');
        }
    } catch (error) {
        console.error('❌ Error processing anomaly:', error);
    }
}

/**
 * Rule: Volume Spike - User performs many actions in short time
 */
async function checkVolumeSpike(auditLog: any): Promise<DetectedAnomaly | null> {
    const { config, severity, isActive } = await getRuleConfig('VOLUME_SPIKE');

    if (!isActive) return null;
    if (!auditLog.action_by) return null;  // Skip if no user

    const ruleConfig = config as VolumeRuleConfig;
    const timeWindow = new Date(Date.now() - (ruleConfig.timeWindowMinutes || 60) * 60 * 1000);

    const recentCount = await prisma.audit_log.count({
        where: {
            action_by: auditLog.action_by,
            action_at: { gte: timeWindow }
        }
    });

    if (recentCount >= (ruleConfig.threshold || 50)) {
        return {
            auditLogId: auditLog.id,
            anomalyType: 'VOLUME_SPIKE',
            severity: severity,
            contextData: {
                actionCount: recentCount,
                timeWindowMinutes: ruleConfig.timeWindowMinutes || 60,
                threshold: ruleConfig.threshold || 50,
                user: auditLog.action_by
            }
        };
    }

    return null;
}

/**
 * Rule: Off Hours - Activity outside business hours
 */
async function checkOffHours(auditLog: any): Promise<DetectedAnomaly | null> {
    const { config, severity, isActive } = await getRuleConfig('OFF_HOURS');

    if (!isActive) return null;

    const ruleConfig = config as OffHoursRuleConfig;
    const actionTime = new Date(auditLog.action_at);
    const hour = actionTime.getHours();
    const day = actionTime.getDay(); // 0=Sunday

    const workHoursStart = ruleConfig.workHoursStart ?? 8;
    const workHoursEnd = ruleConfig.workHoursEnd ?? 18;
    const workDays = ruleConfig.workDays ?? [1, 2, 3, 4, 5];

    const isWorkDay = workDays.includes(day);
    const isWorkHour = hour >= workHoursStart && hour < workHoursEnd;

    if (!isWorkDay || !isWorkHour) {
        return {
            auditLogId: auditLog.id,
            anomalyType: 'OFF_HOURS',
            severity: severity,
            contextData: {
                actionTime: auditLog.action_at,
                dayOfWeek: day,
                hour: hour,
                user: auditLog.action_by,
                configuredWorkHours: `${workHoursStart}:00 - ${workHoursEnd}:00`,
                configuredWorkDays: workDays
            }
        };
    }

    return null;
}

/**
 * Rule: Mass Delete - Many DELETE operations in short time
 */
async function checkMassDelete(auditLog: any): Promise<DetectedAnomaly | null> {
    // Only check for DELETE actions
    if (auditLog.action_type?.code !== 'DELETE') return null;

    const { config, severity, isActive } = await getRuleConfig('MASS_DELETE');

    if (!isActive) return null;
    if (!auditLog.action_by) return null;

    const ruleConfig = config as MassDeleteRuleConfig;
    const timeWindow = new Date(Date.now() - (ruleConfig.timeWindowMinutes || 30) * 60 * 1000);

    const deleteCount = await prisma.audit_log.count({
        where: {
            action_by: auditLog.action_by,
            action_at: { gte: timeWindow },
            action_type: { code: 'DELETE' }
        }
    });

    if (deleteCount >= (ruleConfig.threshold || 10)) {
        return {
            auditLogId: auditLog.id,
            anomalyType: 'MASS_DELETE',
            severity: severity,
            contextData: {
                deleteCount,
                timeWindowMinutes: ruleConfig.timeWindowMinutes || 30,
                threshold: ruleConfig.threshold || 10,
                user: auditLog.action_by
            }
        };
    }

    return null;
}

/**
 * Rule: Rapid Updates - Same entity updated many times
 */
async function checkRapidUpdates(auditLog: any): Promise<DetectedAnomaly | null> {
    // Only check for UPDATE actions
    if (auditLog.action_type?.code !== 'UPDATE') return null;

    const { config, severity, isActive } = await getRuleConfig('RAPID_UPDATES');

    if (!isActive) return null;

    const ruleConfig = config as RapidUpdatesRuleConfig;
    const timeWindow = new Date(Date.now() - (ruleConfig.timeWindowMinutes || 5) * 60 * 1000);

    const updateCount = await prisma.audit_log.count({
        where: {
            entity_type: auditLog.entity_type,
            entity_id: auditLog.entity_id,
            action_at: { gte: timeWindow },
            action_type: { code: 'UPDATE' }
        }
    });

    if (updateCount >= (ruleConfig.threshold || 10)) {
        return {
            auditLogId: auditLog.id,
            anomalyType: 'RAPID_UPDATES',
            severity: severity,
            contextData: {
                updateCount,
                timeWindowMinutes: ruleConfig.timeWindowMinutes || 5,
                threshold: ruleConfig.threshold || 10,
                entityType: auditLog.entity_type,
                entityId: auditLog.entity_id,
                user: auditLog.action_by
            }
        };
    }

    return null;
}

// ============================================================================
// ANOMALY ALERT CRUD OPERATIONS
// ============================================================================

/**
 * Get all anomaly alerts with filters
 */
export async function getAnomalyAlerts(filters: {
    severity?: string;
    anomaly_type?: string;
    is_resolved?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}) {
    const {
        severity,
        anomaly_type,
        is_resolved,
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'desc'
    } = filters;

    const where: any = {};
    if (severity) where.severity = severity;
    if (anomaly_type) where.anomaly_type = anomaly_type;
    if (is_resolved !== undefined) where.is_resolved = is_resolved;

    const [alerts, total] = await Promise.all([
        prisma.anomaly_alert.findMany({
            where,
            orderBy: { [sortBy]: sortOrder },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                audit_log: {
                    include: { action_type: true }
                }
            }
        }),
        prisma.anomaly_alert.count({ where })
    ]);

    return {
        alerts,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
}

/**
 * Get a single anomaly alert by ID
 */
export async function getAnomalyAlertById(id: number) {
    return prisma.anomaly_alert.findUnique({
        where: { id },
        include: {
            audit_log: {
                include: { action_type: true }
            }
        }
    });
}

/**
 * Mark an anomaly as resolved
 */
export async function resolveAnomaly(id: number, resolvedBy: string, resolutionNote?: string) {
    return prisma.anomaly_alert.update({
        where: { id },
        data: {
            is_resolved: true,
            resolved_by: resolvedBy,
            resolved_at: new Date(),
            resolution_note: resolutionNote
        }
    });
}

/**
 * Get anomaly statistics
 */
export async function getAnomalyStats() {
    const [total, unresolved, bySeverity, byType, recent24h] = await Promise.all([
        prisma.anomaly_alert.count(),
        prisma.anomaly_alert.count({ where: { is_resolved: false } }),
        prisma.anomaly_alert.groupBy({
            by: ['severity'],
            _count: { severity: true }
        }),
        prisma.anomaly_alert.groupBy({
            by: ['anomaly_type'],
            _count: { anomaly_type: true }
        }),
        prisma.anomaly_alert.count({
            where: {
                created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
        })
    ]);

    return {
        total,
        unresolved,
        resolved: total - unresolved,
        recent24h,
        bySeverity: bySeverity.map(s => ({ severity: s.severity, count: s._count.severity })),
        byType: byType.map(t => ({ type: t.anomaly_type, count: t._count.anomaly_type }))
    };
}
