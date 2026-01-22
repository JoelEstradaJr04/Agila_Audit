// ============================================================================
// ANOMALY DETECTION TYPES
// ============================================================================

export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AnomalyType =
  | 'VOLUME_SPIKE'      // Unusual number of actions
  | 'OFF_HOURS'         // Activity outside business hours
  | 'MASS_DELETE'       // Bulk delete operations
  | 'RAPID_UPDATES'     // Same entity updated repeatedly
  | 'FIRST_TIME_SPIKE'  // New user with unusual activity
  | 'SUSPICIOUS_PATTERN'; // AI-detected suspicious behavior

// Rule configuration interfaces
export interface VolumeRuleConfig {
  [key: string]: any;  // Index signature for Prisma Json compatibility
  threshold: number;        // Number of actions to trigger
  timeWindowMinutes: number; // Time window in minutes
}

export interface OffHoursRuleConfig {
  [key: string]: any;  // Index signature for Prisma Json compatibility
  workHoursStart: number;   // 24-hour format (e.g., 8 for 8AM)
  workHoursEnd: number;     // 24-hour format (e.g., 18 for 6PM)
  workDays: number[];       // 0=Sunday, 1=Monday, etc.
}

export interface MassDeleteRuleConfig {
  [key: string]: any;  // Index signature for Prisma Json compatibility
  threshold: number;        // Number of DELETE actions to trigger
  timeWindowMinutes: number;
}

export interface RapidUpdatesRuleConfig {
  [key: string]: any;  // Index signature for Prisma Json compatibility
  threshold: number;        // Number of updates to same entity
  timeWindowMinutes: number;
}

export type AnomalyRuleConfig =
  | VolumeRuleConfig
  | OffHoursRuleConfig
  | MassDeleteRuleConfig
  | RapidUpdatesRuleConfig;

// Detected anomaly interface
export interface DetectedAnomaly {
  auditLogId: number;
  anomalyType: AnomalyType;
  severity: AnomalySeverity;
  contextData: Record<string, any>;
}

// LLM analysis result
export interface LLMAnalysisResult {
  explanation: string;
  riskScore: number;       // 1-100
  suggestions: string[];
}

// Admin email interface
export interface AdminEmail {
  email: string;
  name: string;
  role: string;
  department?: string;
}

// Default rule configurations
export const DEFAULT_RULES: Record<string, { config: AnomalyRuleConfig; severity: AnomalySeverity }> = {
  VOLUME_SPIKE: {
    config: {
      threshold: 50,
      timeWindowMinutes: 60
    } as VolumeRuleConfig,
    severity: 'HIGH'
  },
  OFF_HOURS: {
    config: {
      workHoursStart: 8,
      workHoursEnd: 18,
      workDays: [1, 2, 3, 4, 5]  // Monday-Friday
    } as OffHoursRuleConfig,
    severity: 'MEDIUM'
  },
  MASS_DELETE: {
    config: {
      threshold: 10,
      timeWindowMinutes: 30
    } as MassDeleteRuleConfig,
    severity: 'CRITICAL'
  },
  RAPID_UPDATES: {
    config: {
      threshold: 10,
      timeWindowMinutes: 5
    } as RapidUpdatesRuleConfig,
    severity: 'MEDIUM'
  }
};

// API response types
export interface AnomalyAlertResponse {
  id: number;
  audit_log_id: number;
  anomaly_type: string;
  severity: string;
  ai_explanation: string | null;
  ai_risk_score: number | null;
  ai_suggestions: string | null;
  context_data: any;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: Date | null;
  resolution_note: string | null;
  is_notified: boolean;
  notified_at: Date | null;
  notified_to: string[];
  created_at: Date;
  updated_at: Date;
  audit_log?: {
    id: number;
    entity_type: string;
    entity_id: string;
    action_by: string | null;
    action_at: Date;
    action_type: {
      code: string;
    };
  };
}

export interface CreateRecipientDTO {
  email: string;
  name: string;
  role?: string;
  department?: string;
  notify_low?: boolean;
  notify_medium?: boolean;
  notify_high?: boolean;
  notify_critical?: boolean;
}

export interface UpdateRecipientDTO {
  email?: string;
  name?: string;
  role?: string;
  department?: string;
  notify_low?: boolean;
  notify_medium?: boolean;
  notify_high?: boolean;
  notify_critical?: boolean;
  is_active?: boolean;
}
