-- CreateTable
CREATE TABLE "anomaly_alert" (
    "id" SERIAL NOT NULL,
    "audit_log_id" INTEGER NOT NULL,
    "anomaly_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "ai_explanation" TEXT,
    "ai_risk_score" INTEGER,
    "ai_suggestions" TEXT,
    "context_data" JSONB,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolution_note" TEXT,
    "is_notified" BOOLEAN NOT NULL DEFAULT false,
    "notified_at" TIMESTAMP(3),
    "notified_to" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anomaly_alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anomaly_rule" (
    "id" SERIAL NOT NULL,
    "rule_code" TEXT NOT NULL,
    "rule_name" TEXT NOT NULL,
    "description" TEXT,
    "rule_config" JSONB NOT NULL,
    "default_severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anomaly_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_recipient" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "department" TEXT,
    "notify_low" BOOLEAN NOT NULL DEFAULT false,
    "notify_medium" BOOLEAN NOT NULL DEFAULT true,
    "notify_high" BOOLEAN NOT NULL DEFAULT true,
    "notify_critical" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_recipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "anomaly_alert_anomaly_type_idx" ON "anomaly_alert"("anomaly_type");

-- CreateIndex
CREATE INDEX "anomaly_alert_severity_idx" ON "anomaly_alert"("severity");

-- CreateIndex
CREATE INDEX "anomaly_alert_is_resolved_idx" ON "anomaly_alert"("is_resolved");

-- CreateIndex
CREATE INDEX "anomaly_alert_is_notified_idx" ON "anomaly_alert"("is_notified");

-- CreateIndex
CREATE INDEX "anomaly_alert_created_at_idx" ON "anomaly_alert"("created_at");

-- CreateIndex
CREATE INDEX "anomaly_alert_audit_log_id_idx" ON "anomaly_alert"("audit_log_id");

-- CreateIndex
CREATE UNIQUE INDEX "anomaly_rule_rule_code_key" ON "anomaly_rule"("rule_code");

-- CreateIndex
CREATE INDEX "anomaly_rule_rule_code_idx" ON "anomaly_rule"("rule_code");

-- CreateIndex
CREATE INDEX "anomaly_rule_is_active_idx" ON "anomaly_rule"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "notification_recipient_email_key" ON "notification_recipient"("email");

-- CreateIndex
CREATE INDEX "notification_recipient_email_idx" ON "notification_recipient"("email");

-- CreateIndex
CREATE INDEX "notification_recipient_is_active_idx" ON "notification_recipient"("is_active");

-- CreateIndex
CREATE INDEX "notification_recipient_department_idx" ON "notification_recipient"("department");

-- AddForeignKey
ALTER TABLE "anomaly_alert" ADD CONSTRAINT "anomaly_alert_audit_log_id_fkey" FOREIGN KEY ("audit_log_id") REFERENCES "audit_log"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
