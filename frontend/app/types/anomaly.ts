export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AnomalyAlert {
    id: number;
    audit_log_id: number;
    anomaly_type: string;
    severity: AnomalySeverity;

    // AI-Generated Content
    ai_explanation: string | null;
    ai_risk_score: number | null;
    ai_suggestions: string | null; // JSON string

    // Context Data
    context_data: any;

    // Resolution
    is_resolved: boolean;
    resolved_by: string | null;
    resolved_at: string | null;
    resolution_note: string | null;

    // Notification Tracking
    is_notified: boolean;
    notified_at: string | null;
    notified_to: string[];

    // Timestamps
    created_at: string;
    updated_at: string;

    // Relations
    audit_log?: {
        id: number;
        entity_type: string;
        entity_id: string;
        action_by: string | null;
        action_at: string;
        action_type: {
            code: string;
        };
    };
}

export interface AnomalyStats {
    total: number;
    unresolved: number;
    resolved: number;
    recent24h: number;
    bySeverity: { severity: string; count: number }[];
    byType: { type: string; count: number }[];
}
