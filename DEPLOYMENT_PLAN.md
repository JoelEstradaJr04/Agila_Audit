# 🚀 Agila_Audit Deployment Plan

This document outlines the step-by-step plan to deploy the Agila_Audit microservice system to the cloud.

**Date:** 2026-01-23
**Status:** Planning

---

## 🏗️ Architecture Overview

The system consists of three main components that need to be deployed:

1.  **Database**: PostgreSQL (Cloud-hosted).
2.  **Backend API**: Node.js/Express with Prisma (Deployed on Railway).
3.  **Frontend**: Next.js App Router (Deployed on Vercel).

---

## ☁️ Option 1: Full Stack on Railway (Recommended for Ease)

Since a `railway.json` file is already present in your project, deploying the Backend and Database on Railway is the smoothest path.

### 1. Database & Backend Deployment

**Prerequisites:**
- GitHub Account (with the repository pushed)
- Railway Account (https://railway.app)

**Steps:**

1.  **Create a New Project on Railway:**
    - Go to Dashboard -> "New Project" -> "Deploy from GitHub repo".
    - Select your repository.

2.  **Add a Database Service:**
    - In the project view, right-click (or click "New") -> "Database" -> "PostgreSQL".
    - This will automatically provision a cloud Postgres DB for you.
    - **Wait for it to initialize.**

3.  **Configure the Backend Service:**
    - Railway should detect the `railway.json` file.
    - Go to the Backend service settings -> "Variables".
    - **Add necessary environment variables:**

    | Variable | Value / Source |
    |----------|----------------|
    | `DATABASE_URL` | Use the reference variable `${{Postgres.DATABASE_URL}}` provided by Railway. |
    | `PORT` | `8080` (or leave default, Railway manages this). |
    | `HR_API_URL` | URL of the external HR system. |
    | `HR_API_KEY` | API Key for the HR system. |
    | `GEMINI_API_KEY` | Google Gemini API Key. |
    | `ADMIN_EMAILS` | Comma-separated list of fallback admin emails. |
    | `EMAIL_USER` | Email address for sending notifications. |
    | `EMAIL_APP_PASSWORD` | App password for the email account. |
    | `JWT_SECRET` | A strong random string for authentication. |

4.  **Validate Build & Start Commands:**
    - The `railway.json` is set to:
        - **Build:** `cd backend && pnpm install && pnpm prisma:generate && pnpm build`
        - **Start:** `cd backend && pnpm prisma:migrate:prod && pnpm start`
    - *Note:* The start command runs migrations automatically (`prisma migrate deploy`), ensuring your cloud DB schema is always up to date.

5.  **Initial Data Seeding (Critical for Functionality):**
    - Once deployed, the database will be empty.
    - You need to run seeds to populate `action_type` and other static data.
    - **Option A (CLI):** Install Railway CLI, link project, and run `railway run pnpm seed:all` from the backend directory.
    - **Option B (One-off deployment):** Temporarily change the start command to `cd backend && pnpm seed:all && pnpm start`, let it deploy, then change it back.

---

## ⚡ Option 2: Frontend on Vercel (Best for Next.js)

Vercel provides the best performance and integration for Next.js applications.

**Steps:**

1.  **Import Project:**
    - Go to Vercel Dashboard -> "Add New..." -> "Project".
    - Import the same GitHub repository.

2.  **Configure Project Settings:**
    - **Framework Preset:** Next.js
    - **Root Directory:** Edit this and select `frontend`. **(Crucial)**

3.  **Environment Variables:**
    - Add the following environment variable:

    | Variable | Description |
    |----------|-------------|
    | `NEXT_PUBLIC_API_URL` | The public URL of your Railway Backend (e.g., `https://agila-audit-production.up.railway.app`). |

4.  **Deploy:**
    - Click "Deploy".
    - Vercel will build the frontend and deploy it to a global CDN.

---

## 🔍 Functionality Verification Checklist

After deployment, verify the following to ensure the system works as expected:

1.  **Database Connection:**
    - Check Railway logs to ensure Prisma connected successfully.
    - Verify migrations were applied (`prisma migrate deploy` ran without error).

2.  **Data Integrity:**
    - Ensure `action_types` are populated (Login, Logout, Export, Update, etc.).
    - If UI dropdowns for "Action Type" are empty, seeding failed.

3.  **Frontend-Backend Communication:**
    - Open the Vercel URL.
    - Try to log in or view the Dashboard.
    - Inspect Network tab: Requests should go to your Railway Backend URL, not `localhost`.

4.  **Anomaly Detection:**
    - Trigger a test anomaly (e.g., rapid page refreshes or updates if configured).
    - Check if a new record appears in `anomaly_alert` table (connect via Railway CLI or a GUI tool like DBeaver using the Railway connection string).

---

## 🗄️ Database Schema Reference

The following schema will be deployed to the cloud PostgreSQL instance.

```prisma
// FINANCE AUDIT LOGS MICROSERVICE SCHEMA
// ============================================================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// ACTION TYPES REFERENCE TABLE
// ============================================================================

model action_type {
  id          Int        @id @default(autoincrement())
  code        String     @unique   // e.g., CREATE, UPDATE, DELETE, APPROVE, REJECT
  is_active   Boolean    @default(true)
  created_at  DateTime   @default(now())
  updated_at  DateTime   @updatedAt

  audit_logs  audit_log[]
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

model audit_log {
  id              Int       @id @default(autoincrement())
  entity_type     String
  entity_id       String
  action_type_id  Int       // FK → action_type
  action_by       String?
  action_at       DateTime  @default(now())
  previous_data   Json?     // Used by: UPDATE, DELETE
  new_data        Json?     // Used by: CREATE, UPDATE
  version         Int       @default(1)
  ip_address      String?
  created_at      DateTime  @default(now())

  // versioning to be strictly sequential per entity
  @@unique([entity_type, entity_id, version])

  // Relations
  action_type     action_type @relation(fields: [action_type_id], references: [id])
  anomaly_alerts  anomaly_alert[]

  @@index([entity_type, entity_id])
  @@index([action_type_id])
  @@index([action_by])
  @@index([entity_type, action_type_id, action_at])
  @@index([action_at])
  @@index([ip_address])
}

model ApiKey {
  id          Int     @id @default(autoincrement())
  keyHash     String  @unique
  serviceName String
  canWrite    Boolean
  canRead     Boolean
  isActive    Boolean @default(true)
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ============================================================================
// ANOMALY DETECTION SYSTEM
// ============================================================================

model anomaly_alert {
  id              Int       @id @default(autoincrement())
  audit_log_id    Int       // FK → audit_log that triggered this
  anomaly_type    String    // VOLUME_SPIKE, OFF_HOURS, MASS_DELETE, etc.
  severity        String    // LOW, MEDIUM, HIGH, CRITICAL
  
  // AI-Generated Content
  ai_explanation  String?   @db.Text
  ai_risk_score   Int?
  ai_suggestions  String?   @db.Text
  
  // Context Data
  context_data    Json?
  
  // Resolution
  is_resolved     Boolean   @default(false)
  resolved_by     String?
  resolved_at     DateTime?
  resolution_note String?   @db.Text
  
  // Notification Tracking
  is_notified     Boolean   @default(false)
  notified_at     DateTime?
  notified_to     String[]
  
  // Timestamps
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  
  // Relations
  audit_log       audit_log @relation(fields: [audit_log_id], references: [id])
  
  @@index([anomaly_type])
  @@index([severity])
  @@index([is_resolved])
  @@index([is_notified])
  @@index([created_at])
  @@index([audit_log_id])
}

model anomaly_rule {
  id               Int       @id @default(autoincrement())
  rule_code        String    @unique
  rule_name        String
  description      String?   @db.Text
  rule_config      Json
  default_severity String    @default("MEDIUM")
  is_active        Boolean   @default(true)
  created_at       DateTime  @default(now())
  updated_at       DateTime  @updatedAt
  
  @@index([rule_code])
  @@index([is_active])
}

model notification_recipient {
  id              Int       @id @default(autoincrement())
  email           String    @unique
  name            String
  role            String?
  department      String?
  notify_low      Boolean   @default(false)
  notify_medium   Boolean   @default(true)
  notify_high     Boolean   @default(true)
  notify_critical Boolean   @default(true)
  is_active       Boolean   @default(true)
  created_by      String?
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  
  @@index([email])
  @@index([is_active])
  @@index([department])
}

model system_config {
  key         String   @id
  value       String   @db.Text
  description String?  @db.Text
  is_encrypted Boolean @default(false)
  updated_at  DateTime @default(now()) @updatedAt
  updated_by  String?
}
```
