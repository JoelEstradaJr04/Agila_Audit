// ============================================================================
// AUDIT DETAILS BUILDER UTILITY
// ============================================================================
// Generates human-readable, sentence-based details for audit logs.
// 
// ENHANCED FORMAT SUPPORT:
// This utility now supports the enhanced denormalized payload format where
// new_data/previous_data contain:
// {
//   summary: "Miscellaneous Income of ₱1,000.00",
//   fields: [
//     { label: "Department", value: "Inventory", raw_id: 23, type: "reference" },
//     { label: "Amount", value: "₱1,000.00", type: "currency" }
//   ]
// }
//
// When this format is detected, the utility will generate rich, meaningful
// descriptions instead of raw field lists.
// ============================================================================

import { AuditLogResponse } from '../types/auditLog';

// ============================================================================
// INTERFACES
// ============================================================================

interface AuditFieldValue {
  label: string;
  value: any;
  raw_id?: string | number;
  type?: 'text' | 'currency' | 'date' | 'datetime' | 'status' | 'reference';
}

interface DenormalizedAuditData {
  summary: string;
  fields: AuditFieldValue[];
  _raw?: Record<string, any>;
}

interface AuditFieldChange {
  label: string;
  from: any;
  to: any;
  type?: string;
}

interface DenormalizedChangeData {
  summary: string;
  changes: AuditFieldChange[];
  change_count: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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
 * Check if data is in the enhanced denormalized format
 */
function isEnhancedFormat(data: any): data is DenormalizedAuditData {
  return data && typeof data === 'object' && 'summary' in data && Array.isArray(data.fields);
}

/**
 * Check if change data is in the enhanced format
 */
function isEnhancedChangeData(data: any): data is DenormalizedChangeData {
  return data && typeof data === 'object' && 'changes' in data && Array.isArray(data.changes);
}

/**
 * Format a value for display
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '—';
  }
  
  if (typeof value === 'string') {
    // Don't wrap currency or status values in quotes
    if (value.startsWith('₱') || value === 'Approved' || value === 'Rejected' || 
        value === 'Pending' || value === 'Archived' || value === 'Active') {
      return value;
    }
    return `"${value}"`;
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
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
 * Format entity type for display
 * Converts snake_case to Title Case
 */
function formatEntityType(entityType: string): string {
  if (!entityType) return 'Record';
  
  return entityType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Build field changes description for UPDATE actions
 * Supports both enhanced and legacy formats
 */
function buildFieldChanges(previous_data: any, new_data: any, change_data?: any): string {
  // If we have enhanced change_data, use it
  if (isEnhancedChangeData(change_data)) {
    if (change_data.changes.length === 0) {
      return 'no changes detected';
    }
    
    const changeDescriptions = change_data.changes.map(change => {
      const from = change.from === '—' || change.from === null ? 'empty' : change.from;
      const to = change.to === '—' || change.to === null ? 'empty' : change.to;
      return `• ${change.label}: ${from} → ${to}`;
    });
    
    return changeDescriptions.join('\n');
  }
  
  // Fallback: check if previous/new are in enhanced format
  if (isEnhancedFormat(previous_data) && isEnhancedFormat(new_data)) {
    const changes: string[] = [];
    const prevFieldMap = new Map(previous_data.fields.map(f => [f.label, f.value]));
    const newFieldMap = new Map(new_data.fields.map(f => [f.label, f.value]));
    
    const allLabels = new Set([...prevFieldMap.keys(), ...newFieldMap.keys()]);
    
    for (const label of allLabels) {
      const prevVal = prevFieldMap.get(label);
      const newVal = newFieldMap.get(label);
      
      if (JSON.stringify(prevVal) !== JSON.stringify(newVal)) {
        const from = prevVal ?? 'empty';
        const to = newVal ?? 'empty';
        changes.push(`• ${label}: ${from} → ${to}`);
      }
    }
    
    return changes.length > 0 ? changes.join('\n') : 'no changes detected';
  }
  
  // Legacy format: compare raw objects
  if (!previous_data || typeof previous_data !== 'object' || 
      !new_data || typeof new_data !== 'object') {
    return 'unknown fields';
  }

  const changes: string[] = [];
  
  const allFields = new Set([
    ...Object.keys(previous_data),
    ...Object.keys(new_data)
  ]);
  
  for (const field of allFields) {
    // Skip internal fields
    if (field.startsWith('_') || field === 'summary' || field === 'fields') continue;
    
    const previousValue = previous_data[field];
    const newValue = new_data[field];
    
    if (JSON.stringify(previousValue) === JSON.stringify(newValue)) {
      continue;
    }
    
    const prevDisplay = formatValue(previousValue);
    const newDisplay = formatValue(newValue);
    const label = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    changes.push(`• ${label}: ${prevDisplay} → ${newDisplay}`);
  }
  
  return changes.length > 0 ? changes.join('\n') : 'no changes detected';
}

/**
 * Build a human-readable field list from enhanced format
 */
function buildEnhancedFieldList(data: DenormalizedAuditData): string {
  if (!data.fields || data.fields.length === 0) {
    return data.summary || 'No details available';
  }
  
  const fieldLines = data.fields.map(field => {
    const value = field.value ?? '—';
    return `• ${field.label}: ${value}`;
  });
  
  return fieldLines.join('\n');
}

/**
 * Build details for CREATE action - ENHANCED
 */
function buildCreateDetails(auditLog: AuditLogResponse): string {
  const user = getUserIdentifier(auditLog.action_by);
  const entityType = formatEntityType(auditLog.entity_type);
  const entityId = auditLog.entity_id;
  const timestamp = formatDateTime(auditLog.action_at);
  
  let details = `User ${user} created a new ${entityType} record (ID: ${entityId}) at ${timestamp}.`;
  
  // Check for enhanced format
  if (auditLog.new_data && isEnhancedFormat(auditLog.new_data)) {
    const summary = auditLog.new_data.summary;
    const fieldList = buildEnhancedFieldList(auditLog.new_data);
    
    details = `User ${user} created a new ${entityType}: ${summary}\n`;
    details += `Record ID: ${entityId}\n`;
    details += `Created at: ${timestamp}\n\n`;
    details += `Details:\n${fieldList}`;
  } else if (auditLog.new_data && typeof auditLog.new_data === 'object') {
    const fields = Object.keys(auditLog.new_data).filter(f => !f.startsWith('_'));
    if (fields.length > 0 && fields.length <= 10) {
      details += ` Initial values were set for: ${fields.join(', ')}.`;
    } else if (fields.length > 10) {
      details += ` ${fields.length} fields were initialized.`;
    }
  }
  
  return details;
}

/**
 * Build details for UPDATE action - ENHANCED
 */
function buildUpdateDetails(auditLog: AuditLogResponse): string {
  const user = getUserIdentifier(auditLog.action_by);
  const entityType = formatEntityType(auditLog.entity_type);
  const entityId = auditLog.entity_id;
  const timestamp = formatDateTime(auditLog.action_at);
  
  // Check for enhanced change_data
  const changeData = (auditLog as any).change_data;
  
  // Check for enhanced format in new_data
  if (isEnhancedFormat(auditLog.new_data)) {
    const summary = auditLog.new_data.summary;
    let details = `User ${user} updated ${entityType}: ${summary}\n`;
    details += `Record ID: ${entityId}\n`;
    details += `Updated at: ${timestamp}\n\n`;
    
    const fieldChanges = buildFieldChanges(auditLog.previous_data, auditLog.new_data, changeData);
    if (fieldChanges !== 'unknown fields' && fieldChanges !== 'no changes detected') {
      details += `Changes:\n${fieldChanges}`;
    } else {
      details += `No significant changes detected.`;
    }
    
    return details;
  }
  
  // Legacy format
  let details = `User ${user} updated the ${entityType} record (ID: ${entityId}) at ${timestamp}.`;
  const fieldChanges = buildFieldChanges(auditLog.previous_data, auditLog.new_data, changeData);
  
  if (fieldChanges !== 'unknown fields' && fieldChanges !== 'no changes detected') {
    details += `\n\nChanges:\n${fieldChanges}`;
  } else {
    details += ` ${fieldChanges}.`;
  }
  
  return details;
}

/**
 * Build details for DELETE action - ENHANCED
 */
function buildDeleteDetails(auditLog: AuditLogResponse): string {
  const user = getUserIdentifier(auditLog.action_by);
  const entityType = formatEntityType(auditLog.entity_type);
  const entityId = auditLog.entity_id;
  const timestamp = formatDateTime(auditLog.action_at);
  
  // Check for enhanced format
  if (auditLog.previous_data && isEnhancedFormat(auditLog.previous_data)) {
    const summary = auditLog.previous_data.summary;
    let details = `User ${user} deleted ${entityType}: ${summary}\n`;
    details += `Record ID: ${entityId}\n`;
    details += `Deleted at: ${timestamp}\n\n`;
    details += `Deleted record details:\n${buildEnhancedFieldList(auditLog.previous_data)}`;
    return details;
  }
  
  return `User ${user} deleted the ${entityType} record (ID: ${entityId}) at ${timestamp}.`;
}

/**
 * Build details for ARCHIVE action - ENHANCED
 */
function buildArchiveDetails(auditLog: AuditLogResponse): string {
  const user = getUserIdentifier(auditLog.action_by);
  const entityType = formatEntityType(auditLog.entity_type);
  const entityId = auditLog.entity_id;
  const timestamp = formatDateTime(auditLog.action_at);
  
  if (isEnhancedFormat(auditLog.new_data)) {
    let details = `User ${user} archived ${entityType}\n`;
    details += `Record ID: ${entityId}\n`;
    details += `Archived at: ${timestamp}`;
    return details;
  }
  
  return `User ${user} archived the ${entityType} record (ID: ${entityId}) at ${timestamp}.`;
}

/**
 * Build details for UNARCHIVE action - ENHANCED
 */
function buildUnarchiveDetails(auditLog: AuditLogResponse): string {
  const user = getUserIdentifier(auditLog.action_by);
  const entityType = formatEntityType(auditLog.entity_type);
  const entityId = auditLog.entity_id;
  const timestamp = formatDateTime(auditLog.action_at);
  
  return `User ${user} unarchived the ${entityType} record (ID: ${entityId}) at ${timestamp}.`;
}

/**
 * Build details for EXPORT action - ENHANCED
 */
function buildExportDetails(auditLog: AuditLogResponse): string {
  const user = getUserIdentifier(auditLog.action_by);
  const entityType = formatEntityType(auditLog.entity_type);
  const timestamp = formatDateTime(auditLog.action_at);
  const referenceId = auditLog.entity_id;
  
  // Check for enhanced format
  if (isEnhancedFormat(auditLog.new_data)) {
    let details = `User ${user} exported ${entityType} data\n`;
    details += `Export ID: ${referenceId}\n`;
    details += `Exported at: ${timestamp}\n\n`;
    details += `Export details:\n${buildEnhancedFieldList(auditLog.new_data)}`;
    return details;
  }
  
  return `User ${user} exported ${entityType} data at ${timestamp}. Export reference ID: ${referenceId}.`;
}

/**
 * Build details for IMPORT action - ENHANCED
 */
function buildImportDetails(auditLog: AuditLogResponse): string {
  const user = getUserIdentifier(auditLog.action_by);
  const entityType = formatEntityType(auditLog.entity_type);
  const timestamp = formatDateTime(auditLog.action_at);
  const referenceId = auditLog.entity_id;
  
  // Check for enhanced format
  if (isEnhancedFormat(auditLog.new_data)) {
    let details = `User ${user} imported ${entityType} data\n`;
    details += `Import ID: ${referenceId}\n`;
    details += `Imported at: ${timestamp}\n\n`;
    details += `Import details:\n${buildEnhancedFieldList(auditLog.new_data)}`;
    return details;
  }
  
  return `User ${user} imported data into ${entityType} at ${timestamp}. Import reference ID: ${referenceId}.`;
}

/**
 * Build details for APPROVE action - ENHANCED
 */
function buildApproveDetails(auditLog: AuditLogResponse): string {
  const user = getUserIdentifier(auditLog.action_by);
  const entityType = formatEntityType(auditLog.entity_type);
  const entityId = auditLog.entity_id;
  const timestamp = formatDateTime(auditLog.action_at);
  
  // Check for enhanced format
  if (isEnhancedFormat(auditLog.new_data)) {
    const summary = auditLog.new_data.summary;
    let details = `User ${user} approved ${entityType}: ${summary}\n`;
    details += `Record ID: ${entityId}\n`;
    details += `Approved at: ${timestamp}\n\n`;
    details += `Details:\n${buildEnhancedFieldList(auditLog.new_data)}`;
    return details;
  }
  
  return `User ${user} approved the ${entityType} record (ID: ${entityId}) at ${timestamp}.`;
}

/**
 * Build details for REJECT action - ENHANCED
 */
function buildRejectDetails(auditLog: AuditLogResponse): string {
  const user = getUserIdentifier(auditLog.action_by);
  const entityType = formatEntityType(auditLog.entity_type);
  const entityId = auditLog.entity_id;
  const timestamp = formatDateTime(auditLog.action_at);
  
  // Check for enhanced format
  if (isEnhancedFormat(auditLog.new_data)) {
    const summary = auditLog.new_data.summary;
    let details = `User ${user} rejected ${entityType}: ${summary}\n`;
    details += `Record ID: ${entityId}\n`;
    details += `Rejected at: ${timestamp}\n\n`;
    
    // Find rejection reason in fields
    const reasonField = auditLog.new_data.fields.find(f => 
      f.label.toLowerCase().includes('reason') || f.label.toLowerCase().includes('rejection')
    );
    if (reasonField) {
      details += `Rejection Reason: ${reasonField.value}\n\n`;
    }
    
    details += `Details:\n${buildEnhancedFieldList(auditLog.new_data)}`;
    return details;
  }
  
  // Check for reason in legacy format
  const reason = auditLog.new_data?.reason || auditLog.new_data?.rejection_reason;
  let details = `User ${user} rejected the ${entityType} record (ID: ${entityId}) at ${timestamp}.`;
  if (reason) {
    details += ` Reason: ${reason}`;
  }
  return details;
}

/**
 * Build details for LOGIN action
 */
function buildLoginDetails(auditLog: AuditLogResponse): string {
  const user = getUserIdentifier(auditLog.action_by);
  const timestamp = formatDateTime(auditLog.action_at);
  
  let details = `User ${user} logged in at ${timestamp}`;
  
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
 * Supports ENHANCED denormalized format where new_data/previous_data contain:
 * { summary: string, fields: AuditFieldValue[] }
 * 
 * @param auditLog - The audit log record with all schema fields
 * @returns A human-readable sentence describing the audit action
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
      
      case 'APPROVE':
        return buildApproveDetails(auditLog);
      
      case 'REJECT':
        return buildRejectDetails(auditLog);
      
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
        const entityType = formatEntityType(auditLog.entity_type);
        const timestamp = formatDateTime(auditLog.action_at);
        
        // Check for enhanced format in new_data
        if (isEnhancedFormat(auditLog.new_data)) {
          return `User ${user} performed '${actionCode}' on ${entityType}: ${auditLog.new_data.summary}\nRecord ID: ${auditLog.entity_id}\nAt: ${timestamp}`;
        }
        
        return `User ${user} performed action '${actionCode}' on ${entityType} (ID: ${auditLog.entity_id}) at ${timestamp}.`;
    }
  } catch (error: any) {
    console.error(`Error building audit details for log ID ${auditLog.id}:`, error.message);
    // Return a safe fallback
    return `Audit log entry for ${formatEntityType(auditLog.entity_type)} (ID: ${auditLog.entity_id}).`;
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
