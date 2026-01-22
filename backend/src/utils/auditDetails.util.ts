// ============================================================================
// AUDIT DETAILS BUILDER UTILITY
// ============================================================================
// Generates human-readable, sentence-based details for audit logs
// Uses ONLY fields defined in the Prisma schema
// This is the single source of truth for audit log formatting

import { AuditLogResponse } from '../types/auditLog';

/**
 * Format a date into a human-readable string
 * Example: "January 5, 2026, 10:15 AM"
 */
function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

/**
 * Get the user identifier, defaulting to 'System' if null
 */
function getUserIdentifier(action_by: string | null): string {
  return action_by || 'System';
}

/**
 * Build field changes description for UPDATE actions
 * Compares previous_data and new_data to generate change descriptions
 */
function buildFieldChanges(previous_data: any, new_data: any): string {
  // Ensure both previous_data and new_data are valid objects
  if (!previous_data || typeof previous_data !== 'object' || 
      !new_data || typeof new_data !== 'object') {
    return 'unknown fields';
  }

  const changes: string[] = [];
  
  // Get all unique fields from both previous_data and new_data
  const allFields = new Set([
    ...Object.keys(previous_data),
    ...Object.keys(new_data)
  ]);
  
  for (const field of allFields) {
    const previousValue = previous_data[field];
    const newValue = new_data[field];
    
    // Skip if values are the same
    if (JSON.stringify(previousValue) === JSON.stringify(newValue)) {
      continue;
    }
    
    // Format values for display
    const prevDisplay = formatValue(previousValue);
    const newDisplay = formatValue(newValue);
    
    changes.push(`${field}: ${prevDisplay} → ${newDisplay}`);
  }
  
  return changes.length > 0 ? changes.join('; ') : 'no changes detected';
}

/**
 * Format a value for display in field changes
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  
  if (typeof value === 'number') {
    return String(value);
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

/**
 * Build details for CREATE action
 */
function buildCreateDetails(auditLog: AuditLogResponse): string {
  const user = getUserIdentifier(auditLog.action_by);
  const entityType = auditLog.entity_type;
  const entityId = auditLog.entity_id;
  const timestamp = formatDateTime(auditLog.action_at);
  
  let details = `User ${user} created a new ${entityType} record (ID: ${entityId}) at ${timestamp}.`;
  
  // Optional extension: if new_data exists, list the fields that were set
  if (auditLog.new_data && typeof auditLog.new_data === 'object') {
    const fields = Object.keys(auditLog.new_data);
    if (fields.length > 0) {
      details += ` Initial values were set for: ${fields.join(', ')}.`;
    }
  }
  
  return details;
}

/**
 * Build details for UPDATE action
 */
function buildUpdateDetails(auditLog: AuditLogResponse): string {
  const user = getUserIdentifier(auditLog.action_by);
  const entityType = auditLog.entity_type;
  const entityId = auditLog.entity_id;
  const timestamp = formatDateTime(auditLog.action_at);
  
  const fieldChanges = buildFieldChanges(auditLog.previous_data, auditLog.new_data);
  
  // Build main message
  let details = `User ${user} updated the ${entityType} record (ID: ${entityId}) at ${timestamp}.`;
  
  // Add field changes section
  if (fieldChanges !== 'unknown fields' && fieldChanges !== 'no changes detected') {
    details += `\n\nChanges:\n${fieldChanges}`;
  } else {
    details += ` ${fieldChanges}.`;
  }
  
  return details;
}

/**
 * Build details for DELETE action
 */
function buildDeleteDetails(auditLog: AuditLogResponse): string {
  const user = getUserIdentifier(auditLog.action_by);
  const entityType = auditLog.entity_type;
  const entityId = auditLog.entity_id;
  const timestamp = formatDateTime(auditLog.action_at);
  
  return `User ${user} deleted the ${entityType} record (ID: ${entityId}) at ${timestamp}.`;
}

/**
 * Build details for ARCHIVE action
 */
function buildArchiveDetails(auditLog: AuditLogResponse): string {
  const user = getUserIdentifier(auditLog.action_by);
  const entityType = auditLog.entity_type;
  const entityId = auditLog.entity_id;
  const timestamp = formatDateTime(auditLog.action_at);
  
  return `User ${user} archived the ${entityType} record (ID: ${entityId}) at ${timestamp}.`;
}

/**
 * Build details for UNARCHIVE action
 */
function buildUnarchiveDetails(auditLog: AuditLogResponse): string {
  const user = getUserIdentifier(auditLog.action_by);
  const entityType = auditLog.entity_type;
  const entityId = auditLog.entity_id;
  const timestamp = formatDateTime(auditLog.action_at);
  
  return `User ${user} unarchived the ${entityType} record (ID: ${entityId}) at ${timestamp}.`;
}

/**
 * Build details for EXPORT action
 * REQUIRES entity_id as reference identifier
 */
function buildExportDetails(auditLog: AuditLogResponse): string {
  const user = getUserIdentifier(auditLog.action_by);
  const entityType = auditLog.entity_type;
  const timestamp = formatDateTime(auditLog.action_at);
  const referenceId = auditLog.entity_id;
  
  // Validate that reference ID exists
  if (!referenceId || referenceId.trim() === '') {
    throw new Error('EXPORT action requires a valid entity_id as reference identifier');
  }
  
  return `User ${user} exported ${entityType} data at ${timestamp}. Export reference ID: ${referenceId}.`;
}

/**
 * Build details for IMPORT action
 * REQUIRES entity_id as reference identifier
 */
function buildImportDetails(auditLog: AuditLogResponse): string {
  const user = getUserIdentifier(auditLog.action_by);
  const entityType = auditLog.entity_type;
  const timestamp = formatDateTime(auditLog.action_at);
  const referenceId = auditLog.entity_id;
  
  // Validate that reference ID exists
  if (!referenceId || referenceId.trim() === '') {
    throw new Error('IMPORT action requires a valid entity_id as reference identifier');
  }
  
  return `User ${user} imported data into ${entityType} at ${timestamp}. Import reference ID: ${referenceId}.`;
}

/**
 * Build details for LOGIN action
 */
function buildLoginDetails(auditLog: AuditLogResponse): string {
  const user = getUserIdentifier(auditLog.action_by);
  const timestamp = formatDateTime(auditLog.action_at);
  
  let details = `User ${user} logged in at ${timestamp}`;
  
  // Add IP address if available
  if (auditLog.ip_address) {
    details += ` from IP address ${auditLog.ip_address}`;
  }
  
  details += '.';
  
  return details;
}

/**
 * Build details for LOGOUT action
 */
function buildLogoutDetails(auditLog: AuditLogResponse): string {
  const user = getUserIdentifier(auditLog.action_by);
  const timestamp = formatDateTime(auditLog.action_at);
  
  let details = `User ${user} logged out at ${timestamp}`;
  
  // Add IP address if available
  if (auditLog.ip_address) {
    details += ` from IP address ${auditLog.ip_address}`;
  }
  
  details += '.';
  
  return details;
}

/**
 * Main function to build audit log details based on action type
 * This is the single source of truth for generating human-readable audit descriptions
 * 
 * @param auditLog - The audit log record with all schema fields
 * @returns A human-readable sentence describing the audit action
 * @throws Error if action type is unknown or required fields are missing
 */
export function buildAuditDetails(auditLog: AuditLogResponse): string {
  const actionCode = auditLog.action_type.code.toUpperCase();
  
  try {
    switch (actionCode) {
      case 'CREATE':
        return buildCreateDetails(auditLog);
      
      case 'UPDATE':
        return buildUpdateDetails(auditLog);
      
      case 'DELETE':
        return buildDeleteDetails(auditLog);
      
      case 'ARCHIVE':
        return buildArchiveDetails(auditLog);
      
      case 'UNARCHIVE':
        return buildUnarchiveDetails(auditLog);
      
      case 'EXPORT':
        return buildExportDetails(auditLog);
      
      case 'IMPORT':
        return buildImportDetails(auditLog);
      
      case 'LOGIN':
        return buildLoginDetails(auditLog);
      
      case 'LOGOUT':
        return buildLogoutDetails(auditLog);
      
      default:
        // Fallback for unknown action types
        const user = getUserIdentifier(auditLog.action_by);
        const timestamp = formatDateTime(auditLog.action_at);
        return `User ${user} performed action '${actionCode}' on ${auditLog.entity_type} (ID: ${auditLog.entity_id}) at ${timestamp}.`;
    }
  } catch (error: any) {
    console.error(`Error building audit details for log ID ${auditLog.id}:`, error.message);
    // Return a safe fallback
    return `Audit log entry for ${auditLog.entity_type} (ID: ${auditLog.entity_id}).`;
  }
}

/**
 * Build details for brief audit log responses
 * Used when full audit log data is not available
 */
export function buildBriefAuditDetails(
  entity_type: string,
  entity_id: string,
  action_type_code: string,
  action_by: string | null,
  action_at: Date,
  ip_address: string | null
): string {
  // Create a minimal audit log object for details generation
  const minimalLog: AuditLogResponse = {
    id: 0,
    entity_type,
    entity_id,
    action_type: {
      id: 0,
      code: action_type_code,
    },
    action_by,
    action_from: null,
    action_at,
    previous_data: null,
    new_data: null,
    version: 0,
    ip_address,
    created_at: action_at,
  };
  
  return buildAuditDetails(minimalLog);
}
