// ============================================================================
// EMAIL SERVICE
// Sends email notifications for anomaly alerts
// ============================================================================

import { AdminEmail, LLMAnalysisResult } from '../types/anomaly';

// Email configuration
const EMAIL_ENABLED = !!(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4000';

/**
 * Send anomaly alert email to admin recipients
 */
export async function sendAnomalyAlert(
    alert: any,
    aiAnalysis: LLMAnalysisResult,
    recipients: AdminEmail[]
): Promise<void> {
    if (recipients.length === 0) {
        console.warn('⚠️ No recipients for anomaly alert');
        return;
    }

    if (!EMAIL_ENABLED) {
        console.log('ℹ️ Email not configured. Would send alert to:', recipients.map(r => r.email).join(', '));
        console.log('📧 Alert details:', {
            severity: alert.severity,
            type: alert.anomaly_type,
            explanation: aiAnalysis.explanation
        });
        return;
    }

    try {
        // Dynamic import to avoid issues if nodemailer is not installed
        const nodemailer = (await import('nodemailer')).default;

        // Configure transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD
            }
        });

        const emailHtml = buildEmailTemplate(alert, aiAnalysis);
        const emailText = buildEmailTextVersion(alert, aiAnalysis);

        const mailOptions = {
            from: `"Agila Audit System" <${process.env.EMAIL_USER}>`,
            to: recipients.map(r => r.email).join(', '),
            subject: `🚨 [${alert.severity}] Anomaly Detected: ${formatAnomalyType(alert.anomaly_type)}`,
            text: emailText,
            html: emailHtml
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Anomaly alert email sent to ${recipients.length} recipient(s)`);
    } catch (error) {
        console.error('❌ Failed to send anomaly alert email:', error);
        throw error;
    }
}

/**
 * Build HTML email template
 */
function buildEmailTemplate(alert: any, aiAnalysis: LLMAnalysisResult): string {
    const severityColors: Record<string, string> = {
        LOW: '#28a745',
        MEDIUM: '#ffc107',
        HIGH: '#fd7e14',
        CRITICAL: '#dc3545'
    };

    const color = severityColors[alert.severity] || '#6c757d';
    const suggestions = typeof aiAnalysis.suggestions === 'string'
        ? JSON.parse(aiAnalysis.suggestions)
        : aiAnalysis.suggestions;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container { 
      max-width: 600px; 
      margin: 20px auto; 
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, ${color}, ${color}dd); 
      color: white; 
      padding: 30px 20px; 
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .header p {
      margin: 10px 0 0 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .content { 
      padding: 30px; 
    }
    .severity-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    .severity-badge { 
      display: inline-block; 
      padding: 8px 20px; 
      border-radius: 25px; 
      font-weight: bold; 
      font-size: 14px;
      color: white; 
      background: ${color}; 
    }
    .risk-score { 
      text-align: right;
    }
    .risk-score .label {
      font-size: 12px;
      color: #666;
      display: block;
    }
    .risk-score .value { 
      font-size: 28px; 
      font-weight: bold; 
      color: ${color}; 
    }
    .ai-section { 
      background: #f8f9fa; 
      padding: 20px; 
      border-radius: 10px; 
      margin: 20px 0; 
      border-left: 4px solid #007bff; 
    }
    .ai-section h3 {
      margin: 0 0 10px 0;
      color: #007bff;
      font-size: 16px;
    }
    .ai-section p {
      margin: 0;
      color: #333;
    }
    .suggestions { 
      list-style-type: none; 
      padding: 0; 
      margin: 20px 0;
    }
    .suggestions li { 
      padding: 12px 0; 
      border-bottom: 1px solid #eee; 
      display: flex;
      align-items: flex-start;
    }
    .suggestions li:last-child {
      border-bottom: none;
    }
    .suggestions li::before { 
      content: "→"; 
      color: ${color}; 
      font-weight: bold; 
      margin-right: 10px;
      flex-shrink: 0;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .details-table td {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    .details-table td:first-child {
      font-weight: 600;
      color: #555;
      width: 40%;
    }
    .button { 
      display: inline-block; 
      padding: 14px 28px; 
      background: linear-gradient(135deg, #007bff, #0056b3); 
      color: white; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: 600;
      text-align: center;
      margin-top: 10px;
    }
    .footer { 
      text-align: center; 
      padding: 20px; 
      background: #f8f9fa;
      color: #6c757d; 
      font-size: 12px; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 Anomaly Detected</h1>
      <p>Agila Audit System Security Alert</p>
    </div>
    
    <div class="content">
      <div class="severity-row">
        <span class="severity-badge">${alert.severity}</span>
        <div class="risk-score">
          <span class="label">Risk Score</span>
          <span class="value">${aiAnalysis.riskScore}/100</span>
        </div>
      </div>
      
      <h2 style="color: ${color}; margin-top: 0; font-size: 20px;">
        ${formatAnomalyType(alert.anomaly_type)}
      </h2>
      
      <div class="ai-section">
        <h3>🤖 AI Analysis</h3>
        <p>${aiAnalysis.explanation}</p>
      </div>
      
      <h3 style="margin-bottom: 10px;">📋 Recommended Actions</h3>
      <ul class="suggestions">
        ${(Array.isArray(suggestions) ? suggestions : []).map((s: string) => `<li>${s}</li>`).join('')}
      </ul>
      
      <h3 style="margin-bottom: 10px;">📊 Alert Details</h3>
      <table class="details-table">
        <tr>
          <td>Alert ID</td>
          <td>#${alert.id}</td>
        </tr>
        <tr>
          <td>Audit Log ID</td>
          <td>#${alert.audit_log_id}</td>
        </tr>
        <tr>
          <td>Detected At</td>
          <td>${new Date(alert.created_at).toLocaleString()}</td>
        </tr>
      </table>
      
      <a href="${FRONTEND_URL}/anomalies/${alert.id}" class="button">
        View in Dashboard →
      </a>
    </div>
    
    <div class="footer">
      <p>This is an automated alert from the Agila Audit System.</p>
      <p>© ${new Date().getFullYear()} Agila Bus Transport. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Build plain text email version
 */
function buildEmailTextVersion(alert: any, aiAnalysis: LLMAnalysisResult): string {
    const suggestions = typeof aiAnalysis.suggestions === 'string'
        ? JSON.parse(aiAnalysis.suggestions)
        : aiAnalysis.suggestions;

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
${(Array.isArray(suggestions) ? suggestions : []).map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}

ALERT DETAILS
-------------
Alert ID: #${alert.id}
Audit Log ID: #${alert.audit_log_id}
Detected At: ${new Date(alert.created_at).toLocaleString()}

View in Dashboard: ${FRONTEND_URL}/anomalies/${alert.id}

---
This is an automated alert from the Agila Audit System.
© ${new Date().getFullYear()} Agila Bus Transport. All rights reserved.
`;
}

/**
 * Format anomaly type for display
 */
function formatAnomalyType(type: string): string {
    const names: Record<string, string> = {
        VOLUME_SPIKE: 'Unusual Activity Volume',
        OFF_HOURS: 'Off-Hours Activity',
        MASS_DELETE: 'Mass Delete Operation',
        RAPID_UPDATES: 'Rapid Entity Updates',
        FIRST_TIME_SPIKE: 'New User Activity Spike',
        SUSPICIOUS_PATTERN: 'Suspicious Pattern Detected'
    };
    return names[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<{ success: boolean; message: string }> {
    if (!EMAIL_ENABLED) {
        return {
            success: false,
            message: 'Email not configured. Set EMAIL_USER and EMAIL_APP_PASSWORD environment variables.'
        };
    }

    try {
        const nodemailer = (await import('nodemailer')).default;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD
            }
        });

        await transporter.verify();

        return {
            success: true,
            message: `Email configured successfully with ${process.env.EMAIL_USER}`
        };
    } catch (error: any) {
        return {
            success: false,
            message: `Email configuration failed: ${error.message}`
        };
    }
}
