# 🔍 AI-Powered Anomaly Detection System

## Implementation Plan for Agila_Audit

**Created:** 2026-01-21  
**Status:** Planning  
**Estimated Effort:** 4-5 days

---

## 📋 Executive Summary

This plan outlines the implementation of an **AI-powered anomaly detection system** for the Agila_Audit microservice. The system will:

1. Detect suspicious patterns in audit logs using rule-based detection
2. Use **LLM (Gemini/OpenAI)** to generate intelligent, context-aware explanations
3. Send **email notifications** to admin users (emails fetched from HR API)
4. Provide a **dashboard** to view and manage anomaly alerts

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUDIT LOG CREATED                                  │
│                    (from Finance, HR, Inventory, Ops)                        │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ANOMALY DETECTION SERVICE                                │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Step 1: Rule-Based Detection                                        │    │
│  │  ├─ Check volume thresholds                                          │    │
│  │  ├─ Check time-of-day patterns                                       │    │
│  │  ├─ Check action frequency                                           │    │
│  │  └─ Check for suspicious patterns                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                  │                                           │
│                                  ▼ (if anomaly detected)                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Step 2: LLM Analysis (Gemini API)                            🤖 AI │    │
│  │  ├─ Send context (recent logs, user history, anomaly type)          │    │
│  │  ├─ Generate human-readable explanation                              │    │
│  │  ├─ Suggest possible causes                                          │    │
│  │  └─ Provide recommended actions                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STORE ANOMALY ALERT                                   │
│                    (PostgreSQL: anomaly_alert table)                         │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EMAIL NOTIFICATION                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Step 1: Fetch Admin Emails from HR API                              │    │
│  │  GET HR_API_URL/api/admins                                           │    │
│  │  Response: [{ email: "admin1@agila.com", role: "Finance Admin" }]   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Step 2: Send Email via Nodemailer                                   │    │
│  │  ├─ Include anomaly details                                          │    │
│  │  ├─ Include AI-generated explanation                                 │    │
│  │  └─ Include link to dashboard                                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 New Dependencies

### Backend (`backend/package.json`)

```json
{
  "dependencies": {
    "nodemailer": "^6.9.14",
    "@google/generative-ai": "^0.14.0",
    "node-cron": "^3.0.3"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.4.15",
    "@types/node-cron": "^3.0.11"
  }
}
```

| Package | Purpose |
|---------|---------|
| `nodemailer` | Sending email notifications |
| `@google/generative-ai` | Google Gemini API for LLM analysis |
| `node-cron` | Scheduled anomaly scans (optional) |

---

## 🗄️ Database Changes

### New Table: `anomaly_alert`

Add to `backend/prisma/schema.prisma`:

```prisma
// ============================================================================
// ANOMALY ALERTS
// ============================================================================

model anomaly_alert {
  id              Int       @id @default(autoincrement())
  audit_log_id    Int       // FK → audit_log that triggered this
  anomaly_type    String    // VOLUME_SPIKE, OFF_HOURS, MASS_DELETE, RAPID_UPDATES, etc.
  severity        String    // LOW, MEDIUM, HIGH, CRITICAL
  
  // AI-Generated Content
  ai_explanation  String?   @db.Text  // LLM-generated explanation
  ai_risk_score   Int?      // 1-100 risk score from AI
  ai_suggestions  String?   @db.Text  // LLM-suggested actions
  
  // Context Data
  context_data    Json?     // Additional context (user history, etc.)
  
  // Resolution
  is_resolved     Boolean   @default(false)
  resolved_by     String?
  resolved_at     DateTime?
  resolution_note String?   @db.Text
  
  // Notification Tracking
  is_notified     Boolean   @default(false)
  notified_at     DateTime?
  notified_to     String[]  // Array of email addresses notified
  
  // Timestamps
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  
  // Relations
  audit_log       audit_log @relation(fields: [audit_log_id], references: [id])
  
  // Indexes
  @@index([anomaly_type])
  @@index([severity])
  @@index([is_resolved])
  @@index([is_notified])
  @@index([created_at])
}

// Also add relation to audit_log model
// In the audit_log model, add:
// anomaly_alerts  anomaly_alert[]
```

### New Table: `anomaly_rule`

Configurable rules stored in database:

```prisma
model anomaly_rule {
  id              Int       @id @default(autoincrement())
  rule_code       String    @unique  // e.g., "VOLUME_SPIKE", "OFF_HOURS"
  rule_name       String    // Human-readable name
  description     String?   @db.Text
  
  // Rule Configuration (JSON for flexibility)
  rule_config     Json      // { threshold: 10, timeWindowMinutes: 60, ... }
  
  // Severity and Status
  default_severity String   @default("MEDIUM")  // LOW, MEDIUM, HIGH, CRITICAL
  is_active       Boolean   @default(true)
  
  // Timestamps
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  
  @@index([rule_code])
  @@index([is_active])
}
```

### New Table: `notification_recipient` (Manual Email Management)

This table allows manual management of admin emails without requiring HR API:

```prisma
model notification_recipient {
  id              Int       @id @default(autoincrement())
  email           String    @unique
  name            String
  role            String?   // e.g., "Finance Admin", "SuperAdmin"
  department      String?   // e.g., "Finance", "HR", "Operations"
  
  // Notification Preferences
  notify_low      Boolean   @default(false)  // Receive LOW severity alerts
  notify_medium   Boolean   @default(true)   // Receive MEDIUM severity alerts
  notify_high     Boolean   @default(true)   // Receive HIGH severity alerts
  notify_critical Boolean   @default(true)   // Receive CRITICAL severity alerts
  
  // Status
  is_active       Boolean   @default(true)
  
  // Audit
  created_by      String?
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  
  @@index([email])
  @@index([is_active])
  @@index([department])
}
```

---

## 📧 Admin Email Management (Temporary - Until HR API Ready)

### Priority Order for Getting Admin Emails

```
1. First, try HR API (if configured and available)
         │
         ▼ (if fails or not configured)
2. Fall back to local notification_recipient table
         │
         ▼ (if empty)
3. Fall back to ADMIN_EMAILS environment variable
```

### Manual Email Management API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notification-recipients` | List all recipients |
| POST | `/api/notification-recipients` | Add a new recipient |
| PATCH | `/api/notification-recipients/:id` | Update recipient |
| DELETE | `/api/notification-recipients/:id` | Remove recipient |

### Frontend: Email Management Page

A simple admin page at `/settings/notifications` to:
- View all notification recipients
- Add new admin emails manually
- Set notification preferences per recipient
- Enable/disable recipients

---

## 📁 File Structure

### New Files to Create

```
backend/
├── src/
│   ├── services/
│   │   ├── anomalyDetection.service.ts    # Core detection logic
│   │   ├── llmAnalysis.service.ts         # Gemini AI integration
│   │   ├── email.service.ts               # Email sending
│   │   └── hrIntegration.service.ts       # Fetch admin emails from HR
│   ├── controllers/
│   │   └── anomaly.controller.ts          # API endpoints
│   ├── routes/
│   │   └── anomaly.routes.ts              # Route definitions
│   ├── types/
│   │   └── anomaly.ts                     # TypeScript interfaces
│   └── utils/
│       └── anomalyRules.ts                # Default rule configurations

frontend/
├── app/
│   ├── (pages)/
│   │   └── anomalies/
│   │       └── page.tsx                   # Anomaly dashboard page
│   ├── Components/
│   │   ├── AnomalyCard.tsx               # Individual alert card
│   │   ├── AnomalyTable.tsx              # Table view of alerts
│   │   └── AnomalyStats.tsx              # Statistics/summary component
│   └── styles/
│       └── anomaly.css                    # Styling
```

---

## 🔧 Implementation Details

### Phase 1: Backend Core (Day 1-2)

#### 1.1 Types Definition (`src/types/anomaly.ts`)

```typescript
export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AnomalyType = 
  | 'VOLUME_SPIKE'      // Unusual number of actions
  | 'OFF_HOURS'         // Activity outside business hours
  | 'MASS_DELETE'       // Bulk delete operations
  | 'RAPID_UPDATES'     // Same entity updated repeatedly
  | 'FIRST_TIME_SPIKE'  // New user with unusual activity
  | 'SUSPICIOUS_PATTERN'; // AI-detected suspicious behavior

export interface AnomalyRuleConfig {
  threshold?: number;
  timeWindowMinutes?: number;
  workHoursStart?: number;  // 24-hour format (e.g., 8 for 8AM)
  workHoursEnd?: number;    // 24-hour format (e.g., 18 for 6PM)
  workDays?: number[];      // 0=Sunday, 1=Monday, etc.
}

export interface DetectedAnomaly {
  auditLogId: number;
  anomalyType: AnomalyType;
  severity: AnomalySeverity;
  contextData: any;
}

export interface LLMAnalysisResult {
  explanation: string;
  riskScore: number;
  suggestions: string[];
}

export interface AdminEmail {
  email: string;
  name: string;
  role: string;
  department?: string;
}
```

#### 1.2 Anomaly Detection Service (`src/services/anomalyDetection.service.ts`)

```typescript
import prisma from '../prisma/client';
import { DetectedAnomaly, AnomalyType, AnomalySeverity } from '../types/anomaly';
import { analyzewithLLM } from './llmAnalysis.service';
import { sendAnomalyAlert } from './email.service';
import { getAdminEmails } from './hrIntegration.service';

// Default rule configurations
const DEFAULT_RULES = {
  VOLUME_SPIKE: {
    threshold: 50,           // Actions in time window
    timeWindowMinutes: 60,
    severity: 'HIGH'
  },
  OFF_HOURS: {
    workHoursStart: 8,       // 8 AM
    workHoursEnd: 18,        // 6 PM
    workDays: [1, 2, 3, 4, 5], // Monday-Friday
    severity: 'MEDIUM'
  },
  MASS_DELETE: {
    threshold: 10,           // DELETE actions in time window
    timeWindowMinutes: 30,
    severity: 'CRITICAL'
  },
  RAPID_UPDATES: {
    threshold: 10,           // Updates to same entity
    timeWindowMinutes: 5,
    severity: 'MEDIUM'
  }
};

/**
 * Main function: Check for anomalies after an audit log is created
 */
export async function checkForAnomalies(auditLogId: number): Promise<void> {
  const auditLog = await prisma.audit_log.findUnique({
    where: { id: auditLogId },
    include: { action_type: true }
  });

  if (!auditLog) return;

  const detectedAnomalies: DetectedAnomaly[] = [];

  // Run all detection rules
  const volumeAnomaly = await checkVolumeSpike(auditLog);
  if (volumeAnomaly) detectedAnomalies.push(volumeAnomaly);

  const offHoursAnomaly = checkOffHours(auditLog);
  if (offHoursAnomaly) detectedAnomalies.push(offHoursAnomaly);

  const massDeleteAnomaly = await checkMassDelete(auditLog);
  if (massDeleteAnomaly) detectedAnomalies.push(massDeleteAnomaly);

  const rapidUpdateAnomaly = await checkRapidUpdates(auditLog);
  if (rapidUpdateAnomaly) detectedAnomalies.push(rapidUpdateAnomaly);

  // Process each detected anomaly
  for (const anomaly of detectedAnomalies) {
    await processAnomaly(anomaly);
  }
}

/**
 * Process a detected anomaly: get AI analysis, store, and notify
 */
async function processAnomaly(anomaly: DetectedAnomaly): Promise<void> {
  // Get AI analysis
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

  // Send email notification for HIGH and CRITICAL severity
  if (anomaly.severity === 'HIGH' || anomaly.severity === 'CRITICAL') {
    const adminEmails = await getAdminEmails();
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
  }
}

/**
 * Rule: Volume Spike - User performs many actions in short time
 */
async function checkVolumeSpike(auditLog: any): Promise<DetectedAnomaly | null> {
  const rule = DEFAULT_RULES.VOLUME_SPIKE;
  const timeWindow = new Date(Date.now() - rule.timeWindowMinutes * 60 * 1000);

  const recentCount = await prisma.audit_log.count({
    where: {
      action_by: auditLog.action_by,
      action_at: { gte: timeWindow }
    }
  });

  if (recentCount >= rule.threshold) {
    return {
      auditLogId: auditLog.id,
      anomalyType: 'VOLUME_SPIKE',
      severity: rule.severity as AnomalySeverity,
      contextData: {
        actionCount: recentCount,
        timeWindowMinutes: rule.timeWindowMinutes,
        user: auditLog.action_by
      }
    };
  }

  return null;
}

/**
 * Rule: Off Hours - Activity outside business hours
 */
function checkOffHours(auditLog: any): DetectedAnomaly | null {
  const rule = DEFAULT_RULES.OFF_HOURS;
  const actionTime = new Date(auditLog.action_at);
  const hour = actionTime.getHours();
  const day = actionTime.getDay(); // 0=Sunday

  const isWorkDay = rule.workDays.includes(day);
  const isWorkHour = hour >= rule.workHoursStart && hour < rule.workHoursEnd;

  if (!isWorkDay || !isWorkHour) {
    return {
      auditLogId: auditLog.id,
      anomalyType: 'OFF_HOURS',
      severity: rule.severity as AnomalySeverity,
      contextData: {
        actionTime: auditLog.action_at,
        dayOfWeek: day,
        hour: hour,
        user: auditLog.action_by
      }
    };
  }

  return null;
}

/**
 * Rule: Mass Delete - Many DELETE operations in short time
 */
async function checkMassDelete(auditLog: any): Promise<DetectedAnomaly | null> {
  if (auditLog.action_type.code !== 'DELETE') return null;

  const rule = DEFAULT_RULES.MASS_DELETE;
  const timeWindow = new Date(Date.now() - rule.timeWindowMinutes * 60 * 1000);

  const deleteCount = await prisma.audit_log.count({
    where: {
      action_by: auditLog.action_by,
      action_at: { gte: timeWindow },
      action_type: { code: 'DELETE' }
    }
  });

  if (deleteCount >= rule.threshold) {
    return {
      auditLogId: auditLog.id,
      anomalyType: 'MASS_DELETE',
      severity: rule.severity as AnomalySeverity,
      contextData: {
        deleteCount,
        timeWindowMinutes: rule.timeWindowMinutes,
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
  if (auditLog.action_type.code !== 'UPDATE') return null;

  const rule = DEFAULT_RULES.RAPID_UPDATES;
  const timeWindow = new Date(Date.now() - rule.timeWindowMinutes * 60 * 1000);

  const updateCount = await prisma.audit_log.count({
    where: {
      entity_type: auditLog.entity_type,
      entity_id: auditLog.entity_id,
      action_at: { gte: timeWindow },
      action_type: { code: 'UPDATE' }
    }
  });

  if (updateCount >= rule.threshold) {
    return {
      auditLogId: auditLog.id,
      anomalyType: 'RAPID_UPDATES',
      severity: rule.severity as AnomalySeverity,
      contextData: {
        updateCount,
        timeWindowMinutes: rule.timeWindowMinutes,
        entityType: auditLog.entity_type,
        entityId: auditLog.entity_id
      }
    };
  }

  return null;
}
```

#### 1.3 LLM Analysis Service (`src/services/llmAnalysis.service.ts`)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DetectedAnomaly, LLMAnalysisResult } from '../types/anomaly';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function analyzeWithLLM(anomaly: DetectedAnomaly): Promise<LLMAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = buildPrompt(anomaly);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse structured response
    return parseAIResponse(text, anomaly);
  } catch (error) {
    console.error('LLM Analysis failed:', error);
    // Fallback to basic explanation
    return {
      explanation: generateFallbackExplanation(anomaly),
      riskScore: getSeverityScore(anomaly.severity),
      suggestions: ['Review the audit log details', 'Contact the user for clarification']
    };
  }
}

function buildPrompt(anomaly: DetectedAnomaly): string {
  return `You are a security analyst for a financial audit system. Analyze the following anomaly and provide:
1. A clear, professional explanation of why this is suspicious (2-3 sentences)
2. A risk score from 1-100
3. 2-3 recommended actions for administrators

Anomaly Type: ${anomaly.anomalyType}
Severity: ${anomaly.severity}
Context Data: ${JSON.stringify(anomaly.contextData, null, 2)}

Respond in this exact JSON format:
{
  "explanation": "Your explanation here",
  "riskScore": 75,
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}

Be concise and professional. Focus on the business impact and security implications.`;
}

function parseAIResponse(text: string, anomaly: DetectedAnomaly): LLMAnalysisResult {
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        explanation: parsed.explanation || generateFallbackExplanation(anomaly),
        riskScore: Math.min(100, Math.max(1, parsed.riskScore || 50)),
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : []
      };
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
  }

  return {
    explanation: generateFallbackExplanation(anomaly),
    riskScore: getSeverityScore(anomaly.severity),
    suggestions: ['Review the audit log details', 'Contact the user for clarification']
  };
}

function generateFallbackExplanation(anomaly: DetectedAnomaly): string {
  const explanations: Record<string, string> = {
    VOLUME_SPIKE: `User ${anomaly.contextData.user} performed ${anomaly.contextData.actionCount} actions in ${anomaly.contextData.timeWindowMinutes} minutes, which is significantly above normal activity levels.`,
    OFF_HOURS: `Activity detected outside business hours at ${new Date(anomaly.contextData.actionTime).toLocaleString()}. This could indicate unauthorized access or after-hours work that should be verified.`,
    MASS_DELETE: `${anomaly.contextData.deleteCount} delete operations detected in ${anomaly.contextData.timeWindowMinutes} minutes. This could indicate data cleanup, but may also suggest unauthorized data removal.`,
    RAPID_UPDATES: `Entity ${anomaly.contextData.entityType}:${anomaly.contextData.entityId} was updated ${anomaly.contextData.updateCount} times in ${anomaly.contextData.timeWindowMinutes} minutes. This unusual pattern may indicate testing, errors, or suspicious modification attempts.`
  };

  return explanations[anomaly.anomalyType] || 'Unusual activity pattern detected that warrants investigation.';
}

function getSeverityScore(severity: string): number {
  const scores: Record<string, number> = {
    LOW: 25,
    MEDIUM: 50,
    HIGH: 75,
    CRITICAL: 95
  };
  return scores[severity] || 50;
}
```

---

### Phase 2: HR Integration & Email (Day 2-3)

#### 2.1 Notification Recipients Service (`src/services/notificationRecipients.service.ts`)

This service manages admin emails with a 3-tier fallback system:

```typescript
import axios from 'axios';
import prisma from '../prisma/client';
import { AdminEmail, AnomalySeverity } from '../types/anomaly';

const HR_API_URL = process.env.HR_API_URL || '';
const HR_API_KEY = process.env.HR_API_KEY || '';

/**
 * Get admin emails for notifications
 * Priority: 1. HR API (if configured) → 2. Manual DB table → 3. Environment variable
 */
export async function getAdminEmails(severity?: AnomalySeverity): Promise<AdminEmail[]> {
  // Try HR API first (if configured)
  if (HR_API_URL && HR_API_KEY) {
    try {
      const hrEmails = await fetchFromHRApi();
      if (hrEmails.length > 0) {
        console.log(`Fetched ${hrEmails.length} admin emails from HR API`);
        return hrEmails;
      }
    } catch (error) {
      console.warn('HR API unavailable, falling back to local database:', error);
    }
  }

  // Fallback to manual notification_recipient table
  const dbRecipients = await getRecipientsFromDatabase(severity);
  if (dbRecipients.length > 0) {
    console.log(`Using ${dbRecipients.length} recipients from local database`);
    return dbRecipients;
  }

  // Final fallback to environment variable
  const envEmails = getRecipientsFromEnv();
  if (envEmails.length > 0) {
    console.log(`Using ${envEmails.length} recipients from ADMIN_EMAILS env var`);
    return envEmails;
  }

  console.warn('No notification recipients configured!');
  return [];
}

/**
 * Fetch admin emails from HR System API
 */
async function fetchFromHRApi(): Promise<AdminEmail[]> {
  const response = await axios.get(`${HR_API_URL}/api/admins`, {
    headers: {
      'x-api-key': HR_API_KEY,
      'Content-Type': 'application/json'
    },
    timeout: 5000  // 5 second timeout
  });

  if (Array.isArray(response.data)) {
    return response.data.map((admin: any) => ({
      email: admin.email,
      name: admin.name || `${admin.first_name} ${admin.last_name}`.trim(),
      role: admin.role || admin.position_name || 'Admin',
      department: admin.department || admin.department_name
    }));
  }

  return [];
}

/**
 * Get recipients from local notification_recipient table
 */
async function getRecipientsFromDatabase(severity?: AnomalySeverity): Promise<AdminEmail[]> {
  // Build where clause based on severity preference
  const severityFilter: any = { is_active: true };
  
  if (severity) {
    switch (severity) {
      case 'LOW':
        severityFilter.notify_low = true;
        break;
      case 'MEDIUM':
        severityFilter.notify_medium = true;
        break;
      case 'HIGH':
        severityFilter.notify_high = true;
        break;
      case 'CRITICAL':
        severityFilter.notify_critical = true;
        break;
    }
  }

  const recipients = await prisma.notification_recipient.findMany({
    where: severityFilter
  });

  return recipients.map(r => ({
    email: r.email,
    name: r.name,
    role: r.role || 'Admin',
    department: r.department || undefined
  }));
}

/**
 * Get recipients from ADMIN_EMAILS environment variable
 */
function getRecipientsFromEnv(): AdminEmail[] {
  const emailList = process.env.ADMIN_EMAILS?.split(',') || [];
  return emailList
    .map(email => email.trim())
    .filter(email => email.length > 0)
    .map(email => ({
      email,
      name: 'Administrator',
      role: 'Admin'
    }));
}

// ============================================================================
// CRUD OPERATIONS FOR MANUAL EMAIL MANAGEMENT
// ============================================================================

/**
 * Get all notification recipients
 */
export async function getAllRecipients() {
  return prisma.notification_recipient.findMany({
    orderBy: { created_at: 'desc' }
  });
}

/**
 * Add a new notification recipient
 */
export async function addRecipient(data: {
  email: string;
  name: string;
  role?: string;
  department?: string;
  notify_low?: boolean;
  notify_medium?: boolean;
  notify_high?: boolean;
  notify_critical?: boolean;
  created_by?: string;
}) {
  return prisma.notification_recipient.create({
    data: {
      email: data.email,
      name: data.name,
      role: data.role,
      department: data.department,
      notify_low: data.notify_low ?? false,
      notify_medium: data.notify_medium ?? true,
      notify_high: data.notify_high ?? true,
      notify_critical: data.notify_critical ?? true,
      created_by: data.created_by
    }
  });
}

/**
 * Update a notification recipient
 */
export async function updateRecipient(id: number, data: {
  email?: string;
  name?: string;
  role?: string;
  department?: string;
  notify_low?: boolean;
  notify_medium?: boolean;
  notify_high?: boolean;
  notify_critical?: boolean;
  is_active?: boolean;
}) {
  return prisma.notification_recipient.update({
    where: { id },
    data
  });
}

/**
 * Delete a notification recipient
 */
export async function deleteRecipient(id: number) {
  return prisma.notification_recipient.delete({
    where: { id }
  });
}
```

#### 2.2 Notification Recipients API Routes

Add routes for manual email management (`src/routes/notificationRecipients.routes.ts`):

```typescript
import { Router } from 'express';
import {
  getAllRecipients,
  addRecipient,
  updateRecipient,
  deleteRecipient
} from '../services/notificationRecipients.service';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/notification-recipients - List all recipients
router.get('/', async (req, res) => {
  try {
    const recipients = await getAllRecipients();
    res.json({ success: true, data: recipients });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/notification-recipients - Add new recipient
router.post('/', async (req, res) => {
  try {
    const user = (req as any).user;
    const recipient = await addRecipient({
      ...req.body,
      created_by: user?.id || 'SYSTEM'
    });
    res.status(201).json({ success: true, data: recipient });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, error: 'Email already exists' });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

// PATCH /api/notification-recipients/:id - Update recipient
router.patch('/:id', async (req, res) => {
  try {
    const recipient = await updateRecipient(Number(req.params.id), req.body);
    res.json({ success: true, data: recipient });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/notification-recipients/:id - Delete recipient
router.delete('/:id', async (req, res) => {
  try {
    await deleteRecipient(Number(req.params.id));
    res.json({ success: true, message: 'Recipient deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

#### 2.3 Email Service (`src/services/email.service.ts`)

#### 2.2 Email Service (`src/services/email.service.ts`)

```typescript
import nodemailer from 'nodemailer';
import { AdminEmail, LLMAnalysisResult } from '../types/anomaly';

// Configure transporter (Gmail example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD  // Use App Password, not regular password
  }
});

// For production, consider SendGrid:
// const transporter = nodemailer.createTransport({
//   host: 'smtp.sendgrid.net',
//   port: 587,
//   auth: {
//     user: 'apikey',
//     pass: process.env.SENDGRID_API_KEY
//   }
// });

export async function sendAnomalyAlert(
  alert: any,
  aiAnalysis: LLMAnalysisResult,
  recipients: AdminEmail[]
): Promise<void> {
  if (recipients.length === 0) {
    console.warn('No recipients for anomaly alert');
    return;
  }

  const emailHtml = buildEmailTemplate(alert, aiAnalysis);
  const emailText = buildEmailTextVersion(alert, aiAnalysis);

  const mailOptions = {
    from: `"Agila Audit System" <${process.env.EMAIL_USER}>`,
    to: recipients.map(r => r.email).join(', '),
    subject: `🚨 [${alert.severity}] Anomaly Detected: ${alert.anomaly_type}`,
    text: emailText,
    html: emailHtml
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Anomaly alert email sent to ${recipients.length} recipients`);
  } catch (error) {
    console.error('Failed to send anomaly alert email:', error);
    throw error;
  }
}

function buildEmailTemplate(alert: any, aiAnalysis: LLMAnalysisResult): string {
  const severityColors: Record<string, string> = {
    LOW: '#28a745',
    MEDIUM: '#ffc107',
    HIGH: '#fd7e14',
    CRITICAL: '#dc3545'
  };

  const color = severityColors[alert.severity] || '#6c757d';
  const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:4003';

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, ${color}, ${color}dd); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
    .severity-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; color: white; background: ${color}; }
    .risk-score { font-size: 24px; font-weight: bold; color: ${color}; }
    .ai-section { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #007bff; }
    .suggestions { list-style-type: none; padding: 0; }
    .suggestions li { padding: 8px 0; border-bottom: 1px solid #eee; }
    .suggestions li:before { content: "→ "; color: ${color}; font-weight: bold; }
    .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    .footer { text-align: center; padding: 15px; color: #6c757d; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🔍 Anomaly Detected</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Agila Audit System Alert</p>
    </div>
    
    <div class="content">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <span class="severity-badge">${alert.severity}</span>
        <span>Risk Score: <span class="risk-score">${aiAnalysis.riskScore}/100</span></span>
      </div>
      
      <h2 style="color: ${color}; margin-top: 0;">${formatAnomalyType(alert.anomaly_type)}</h2>
      
      <div class="ai-section">
        <h3 style="margin-top: 0; color: #007bff;">🤖 AI Analysis</h3>
        <p>${aiAnalysis.explanation}</p>
      </div>
      
      <h3>📋 Recommended Actions</h3>
      <ul class="suggestions">
        ${aiAnalysis.suggestions.map(s => `<li>${s}</li>`).join('')}
      </ul>
      
      <h3>📊 Alert Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Alert ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${alert.id}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Audit Log ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${alert.audit_log_id}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Detected At:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(alert.created_at).toLocaleString()}</td></tr>
      </table>
      
      <a href="${dashboardUrl}/anomalies/${alert.id}" class="button">View in Dashboard</a>
    </div>
    
    <div class="footer">
      <p>This is an automated alert from the Agila Audit System.</p>
      <p>© 2026 Agila Bus Transport. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

function buildEmailTextVersion(alert: any, aiAnalysis: LLMAnalysisResult): string {
  return `
ANOMALY DETECTED - ${alert.severity}
=====================================

Type: ${formatAnomalyType(alert.anomaly_type)}
Risk Score: ${aiAnalysis.riskScore}/100

AI ANALYSIS
-----------
${aiAnalysis.explanation}

RECOMMENDED ACTIONS
-------------------
${aiAnalysis.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

ALERT DETAILS
-------------
Alert ID: ${alert.id}
Audit Log ID: ${alert.audit_log_id}
Detected At: ${new Date(alert.created_at).toLocaleString()}

View in Dashboard: ${process.env.FRONTEND_URL || 'http://localhost:4003'}/anomalies/${alert.id}

---
This is an automated alert from the Agila Audit System.
`;
}

function formatAnomalyType(type: string): string {
  const names: Record<string, string> = {
    VOLUME_SPIKE: 'Unusual Activity Volume',
    OFF_HOURS: 'Off-Hours Activity',
    MASS_DELETE: 'Mass Delete Operation',
    RAPID_UPDATES: 'Rapid Entity Updates',
    FIRST_TIME_SPIKE: 'New User Activity Spike',
    SUSPICIOUS_PATTERN: 'Suspicious Pattern Detected'
  };
  return names[type] || type.replace(/_/g, ' ');
}
```

---

### Phase 3: API Routes (Day 3)

#### 3.1 Anomaly Routes (`src/routes/anomaly.routes.ts`)

```typescript
import { Router } from 'express';
import { 
  getAnomalies, 
  getAnomalyById, 
  resolveAnomaly, 
  getAnomalyStats 
} from '../controllers/anomaly.controller';
import { authenticateServiceRequest, requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/anomalies - List all anomalies with filters
router.get('/', getAnomalies);

// GET /api/anomalies/stats - Get anomaly statistics
router.get('/stats', getAnomalyStats);

// GET /api/anomalies/:id - Get single anomaly details
router.get('/:id', getAnomalyById);

// PATCH /api/anomalies/:id/resolve - Mark anomaly as resolved
router.patch('/:id/resolve', resolveAnomaly);

export default router;
```

#### 3.2 Anomaly Controller (`src/controllers/anomaly.controller.ts`)

```typescript
import { Request, Response } from 'express';
import prisma from '../prisma/client';

export async function getAnomalies(req: Request, res: Response): Promise<void> {
  try {
    const { 
      severity, 
      anomaly_type, 
      is_resolved, 
      page = 1, 
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const where: any = {};
    if (severity) where.severity = severity;
    if (anomaly_type) where.anomaly_type = anomaly_type;
    if (is_resolved !== undefined) where.is_resolved = is_resolved === 'true';

    const [anomalies, total] = await Promise.all([
      prisma.anomaly_alert.findMany({
        where,
        orderBy: { [sortBy as string]: sortOrder },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          audit_log: {
            include: { action_type: true }
          }
        }
      }),
      prisma.anomaly_alert.count({ where })
    ]);

    res.json({
      success: true,
      data: anomalies,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getAnomalyById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const anomaly = await prisma.anomaly_alert.findUnique({
      where: { id: Number(id) },
      include: {
        audit_log: {
          include: { action_type: true }
        }
      }
    });

    if (!anomaly) {
      res.status(404).json({ success: false, error: 'Anomaly not found' });
      return;
    }

    res.json({ success: true, data: anomaly });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function resolveAnomaly(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { resolution_note } = req.body;
    const user = (req as any).user;

    const anomaly = await prisma.anomaly_alert.update({
      where: { id: Number(id) },
      data: {
        is_resolved: true,
        resolved_by: user?.id || 'SYSTEM',
        resolved_at: new Date(),
        resolution_note
      }
    });

    res.json({ success: true, data: anomaly });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getAnomalyStats(req: Request, res: Response): Promise<void> {
  try {
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

    res.json({
      success: true,
      data: {
        total,
        unresolved,
        resolved: total - unresolved,
        recent24h,
        bySeverity: bySeverity.map(s => ({ severity: s.severity, count: s._count.severity })),
        byType: byType.map(t => ({ type: t.anomaly_type, count: t._count.anomaly_type }))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
```

---

### Phase 4: Frontend Dashboard (Day 4)

#### 4.1 Anomaly Dashboard Page (`frontend/app/(pages)/anomalies/page.tsx`)

```tsx
"use client";

import React, { useState, useEffect } from "react";
import "../../styles/anomaly.css";

interface AnomalyAlert {
  id: number;
  anomaly_type: string;
  severity: string;
  ai_explanation: string;
  ai_risk_score: number;
  ai_suggestions: string;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  audit_log: {
    id: number;
    entity_type: string;
    entity_id: string;
    action_by: string;
    action_type: { code: string };
  };
}

interface AnomalyStats {
  total: number;
  unresolved: number;
  resolved: number;
  recent24h: number;
  bySeverity: { severity: string; count: number }[];
  byType: { type: string; count: number }[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
  const [stats, setStats] = useState<AnomalyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ severity: "", is_resolved: "" });

  useEffect(() => {
    fetchAnomalies();
    fetchStats();
  }, [filter]);

  const fetchAnomalies = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.severity) params.append("severity", filter.severity);
      if (filter.is_resolved) params.append("is_resolved", filter.is_resolved);

      const res = await fetch(`${API_BASE}/api/anomalies?${params}`);
      const data = await res.json();
      if (data.success) setAnomalies(data.data);
    } catch (error) {
      console.error("Failed to fetch anomalies:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/anomalies/stats`);
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      LOW: "#28a745",
      MEDIUM: "#ffc107",
      HIGH: "#fd7e14",
      CRITICAL: "#dc3545",
    };
    return colors[severity] || "#6c757d";
  };

  const formatAnomalyType = (type: string) => {
    return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="anomaly-page">
      <div className="page-header">
        <h1>🔍 Anomaly Detection</h1>
        <p>AI-powered security monitoring for audit logs</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Alerts</div>
          </div>
          <div className="stat-card critical">
            <div className="stat-value">{stats.unresolved}</div>
            <div className="stat-label">Unresolved</div>
          </div>
          <div className="stat-card success">
            <div className="stat-value">{stats.resolved}</div>
            <div className="stat-label">Resolved</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-value">{stats.recent24h}</div>
            <div className="stat-label">Last 24 Hours</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        <select
          value={filter.severity}
          onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
        >
          <option value="">All Severities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>

        <select
          value={filter.is_resolved}
          onChange={(e) => setFilter({ ...filter, is_resolved: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="false">Unresolved</option>
          <option value="true">Resolved</option>
        </select>
      </div>

      {/* Anomaly List */}
      <div className="anomaly-list">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : anomalies.length === 0 ? (
          <div className="empty-state">
            <span className="emoji">✅</span>
            <h3>No anomalies detected</h3>
            <p>The system is operating normally</p>
          </div>
        ) : (
          anomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className={`anomaly-card ${anomaly.is_resolved ? "resolved" : ""}`}
              style={{ borderLeftColor: getSeverityColor(anomaly.severity) }}
            >
              <div className="anomaly-header">
                <div className="anomaly-title">
                  <span
                    className="severity-badge"
                    style={{ backgroundColor: getSeverityColor(anomaly.severity) }}
                  >
                    {anomaly.severity}
                  </span>
                  <h3>{formatAnomalyType(anomaly.anomaly_type)}</h3>
                </div>
                <div className="risk-score">
                  <span className="label">Risk Score</span>
                  <span
                    className="value"
                    style={{ color: getSeverityColor(anomaly.severity) }}
                  >
                    {anomaly.ai_risk_score}/100
                  </span>
                </div>
              </div>

              <div className="ai-explanation">
                <span className="ai-badge">🤖 AI Analysis</span>
                <p>{anomaly.ai_explanation}</p>
              </div>

              <div className="anomaly-meta">
                <span>📋 Audit Log #{anomaly.audit_log.id}</span>
                <span>👤 {anomaly.audit_log.action_by}</span>
                <span>🕐 {new Date(anomaly.created_at).toLocaleString()}</span>
              </div>

              {anomaly.is_resolved && (
                <div className="resolved-badge">
                  ✓ Resolved by {anomaly.resolved_by} on{" "}
                  {new Date(anomaly.resolved_at!).toLocaleDateString()}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## 🔧 Environment Variables

Add to `backend/.env`:

```env
# Gemini AI (for LLM analysis)
GEMINI_API_KEY=your_gemini_api_key_here

# HR Integration (for admin emails)
HR_API_URL=http://localhost:YOUR_HR_PORT
HR_API_KEY=your_hr_api_key

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your_app_password

# Or SendGrid
SENDGRID_API_KEY=your_sendgrid_key

# Fallback admin emails (comma-separated)
ADMIN_EMAILS=admin1@agila.com,admin2@agila.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:4003
```

---

## ✅ Testing Checklist

### Backend Tests
- [ ] Create audit log and verify anomaly detection triggers
- [ ] Test each rule type (volume, off-hours, mass delete, rapid updates)
- [ ] Verify LLM integration returns valid responses
- [ ] Test email sending with mock recipients
- [ ] Test HR API integration for fetching admin emails

### Frontend Tests
- [ ] Anomaly list loads correctly
- [ ] Filters work (severity, status)
- [ ] Stats display correctly
- [ ] Resolve action works
- [ ] Empty state displays when no anomalies

### Integration Tests
- [ ] End-to-end: Create suspicious audit log → Anomaly detected → Email sent
- [ ] Verify email content is correct and well-formatted
- [ ] Test with actual HR API for admin email retrieval

---

## 📅 Implementation Timeline

| Day | Tasks |
|-----|-------|
| Day 1 | Database schema, types, anomaly detection service |
| Day 2 | LLM integration (Gemini), email service |
| Day 3 | HR integration, API routes, controllers |
| Day 4 | Frontend dashboard |
| Day 5 | Testing, bug fixes, documentation |

---

## 🎯 Success Criteria

1. ✅ System detects at least 4 types of anomalies automatically
2. ✅ AI generates human-readable explanations
3. ✅ Admin users receive email alerts for HIGH/CRITICAL anomalies
4. ✅ Frontend dashboard shows all anomalies with filtering
5. ✅ Anomalies can be marked as resolved with notes
