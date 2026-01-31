// ============================================================================
// NOTIFICATION RECIPIENTS SERVICE
// Manages admin emails with 3-tier fallback: HR API → Database → Env variable
// ============================================================================

import prisma from '../prisma/client';
import { AdminEmail, AnomalySeverity, CreateRecipientDTO, UpdateRecipientDTO } from '../types/anomaly';

const HR_API_URL = process.env.HR_API_URL || '';
const HR_API_KEY = process.env.HR_API_KEY || '';

/**
 * Get admin emails for notifications
 * Priority: 1. HR API (if configured) → 2. Manual DB table → 3. Environment variable
 */
export async function getAdminEmails(severity?: AnomalySeverity): Promise<AdminEmail[]> {
    // Default policy for non-DB sources: Only High/Critical
    const isMajorSeverity = severity === 'HIGH' || severity === 'CRITICAL';

    // Try HR API first (if configured)
    if (HR_API_URL && HR_API_KEY) {
        if (severity && !isMajorSeverity) {
            console.log('ℹ️ Skipping HR API emails for non-major severity');
        } else {
            try {
                const hrEmails = await fetchFromHRApi();
                if (hrEmails.length > 0) {
                    console.log(`✅ Fetched ${hrEmails.length} admin emails from HR API`);
                    return hrEmails;
                }
            } catch (error) {
                console.warn('⚠️ HR API unavailable, falling back to local database:', error);
            }
        }
    }

    // Fallback to manual notification_recipient table (DB handles specific preferences)
    const dbRecipients = await getRecipientsFromDatabase(severity);
    if (dbRecipients.length > 0) {
        console.log(`✅ Using ${dbRecipients.length} recipients from local database`);
        return dbRecipients;
    }

    // Final fallback to environment variable (default: major severity only)
    if (severity && !isMajorSeverity) {
        console.log('ℹ️ Skipping env fallback emails for non-major severity');
        return [];
    }

    const envEmails = getRecipientsFromEnv();
    if (envEmails.length > 0) {
        console.log(`✅ Using ${envEmails.length} recipients from ADMIN_EMAILS env var`);
        return envEmails;
    }

    console.warn('⚠️ No notification recipients configured!');
    return [];
}

/**
 * Fetch admin emails from HR System API
 */
async function fetchFromHRApi(): Promise<AdminEmail[]> {
    // Dynamic import to avoid issues if axios is not installed
    const axios = (await import('axios')).default;

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
            name: admin.name || `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'Admin',
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
 * Get a single recipient by ID
 */
export async function getRecipientById(id: number) {
    return prisma.notification_recipient.findUnique({
        where: { id }
    });
}

/**
 * Add a new notification recipient
 */
export async function addRecipient(data: CreateRecipientDTO & { created_by?: string }) {
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
export async function updateRecipient(id: number, data: UpdateRecipientDTO) {
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

/**
 * Toggle recipient active status
 */
export async function toggleRecipientStatus(id: number) {
    const recipient = await prisma.notification_recipient.findUnique({
        where: { id }
    });

    if (!recipient) {
        throw new Error('Recipient not found');
    }

    return prisma.notification_recipient.update({
        where: { id },
        data: { is_active: !recipient.is_active }
    });
}
