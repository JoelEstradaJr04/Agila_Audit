"use client";
import React, { useState, useEffect } from "react";
import '@app/styles/components/table.css';
import "@app/styles/audit/audit.css";
import PaginationComponent from "@app/Components/pagination";
import Swal from "sweetalert2";
import Loading from '@app/Components/loading';
import { showSuccess, showError, showConfirmation } from '@app/utils/Alerts';
import { formatDisplayText } from '@/app/utils/formatting';
import FilterDropdown, { FilterSection } from "@app/Components/filter";

// Backend API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4004';

type AuditLog = {
  // Backend fields (from schema)
  id: number;
  entity_type: string;
  entity_id: string;
  action_type_id: number;
  action_type_code: string;
  action_by: string | null;
  action_at: string;
  version: number;
  ip_address: string | null;
  created_at: string;
  // UI compatibility fields (computed)
  log_id?: string;
  action?: string;
  table_affected?: string;
  record_id?: string;
  performed_by?: string;
  timestamp?: string;
  details?: string;
};

const formatDateTime = (timestamp: string | undefined) => {
  if (!timestamp) return 'N/A';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return 'Invalid Date';
  }
};

type ViewModalProps = {
  log: AuditLog | null;
  onClose: () => void;
};

const ViewDetailsModal: React.FC<ViewModalProps> = ({ log, onClose }) => {
  if (!log) return null;

  const getActionIcon = (action?: string) => {
    if (!action) return '📋';
    switch (action.toUpperCase()) {
      case 'CREATE': return '✨';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      case 'EXPORT': return '📤';
      case 'VIEW': return '👁️';
      default: return '📋';
    }
  };

  const getTableIcon = (table?: string) => {
    if (!table) return '📊';
    switch (table.toLowerCase()) {
      case 'expenserecord': return '💰';
      case 'revenuerecord': return '📈';
      case 'receipt': return '🧾';
      case 'reimbursement': return '💳';
      default: return '📊';
    }
  };

  return (
      <div className="modalOverlay">
        <div className="viewDetailsModal">
          <div className="modalHeader">
            <h2>Audit Log Details</h2>
            <button onClick={onClose} className="closeButton">&times;</button>
          </div>
          <div className="modalContent">
            <div className="audit-details-container">
              {/* Primary Information Card */}
              <div className="audit-detail-card">
                <div className="audit-detail-row">
                  <div className="audit-detail-icon">🕒</div>
                  <div className="audit-detail-content">
                    <div className="audit-detail-label">Date & Time</div>
                    <div className="audit-detail-value">{formatDateTime(log.timestamp)}</div>
                  </div>
                </div>
                <div className="audit-detail-row">
                  <div className="audit-detail-icon">{getActionIcon(log.action)}</div>
                  <div className="audit-detail-content">
                    <div className="audit-detail-label">Action</div>
                    <div className="audit-detail-value">
                      <span className={`action-badge ${(log.action || '').toLowerCase()}`}>
                        {log.action || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="audit-detail-row">
                  <div className="audit-detail-icon">{getTableIcon(log.table_affected)}</div>
                  <div className="audit-detail-content">
                    <div className="audit-detail-label">Table Affected</div>
                    <div className="audit-detail-value">{formatDisplayText(log.table_affected || '')}</div>
                  </div>
                </div>
              </div>

              {/* Secondary Information Card */}
              <div className="audit-detail-card">
                <div className="audit-detail-row">
                  <div className="audit-detail-icon">🔑</div>
                  <div className="audit-detail-content">
                    <div className="audit-detail-label">Record ID</div>
                    <div className="audit-detail-value">
                      <span className="code-text">{log.record_id || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="audit-detail-row">
                  <div className="audit-detail-icon">👤</div>
                  <div className="audit-detail-content">
                    <div className="audit-detail-label">Performed By</div>
                    <div className="audit-detail-value">{log.performed_by || 'N/A'}</div>
                  </div>
                </div>
                <div className="audit-detail-row">
                  <div className="audit-detail-icon">🌐</div>
                  <div className="audit-detail-content">
                    <div className="audit-detail-label">IP Address</div>
                    <div className="audit-detail-value">
                      <span className="code-text">{log.ip_address || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Card */}
              <div className="audit-detail-card">
                <div className="audit-detail-row">
                  <div className="audit-detail-icon">📋</div>
                  <div className="audit-detail-content">
                    <div className="audit-detail-label">Details</div>
                    <div className="audit-detail-value details-section">
                      {typeof log.details === 'string'
                        ? log.details
                        : JSON.stringify(log.details, null, 2)
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

const AuditPage = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [sortField, setSortField] = useState<keyof AuditLog | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');


  // Available actions for filtering
  const availableActions = [
    { id: 'CREATE', label: 'Create' },
    { id: 'UPDATE', label: 'Update' },
    { id: 'DELETE', label: 'Delete' },
    { id: 'EXPORT', label: 'Export' },
    { id: 'VIEW', label: 'View' }
  ];

  // Available roles for filtering
  const availableRoles = [
    { id: 'admin', label: 'Admin' },
    { id: 'staff', label: 'Staff' }
  ];

  // Available departments for filtering
  const availableDepartments = [
    { id: 'Finance', label: 'Finance' },
    { id: 'HR', label: 'Human Resources' },
    { id: 'Operations', label: 'Operations' },
    { id: 'Inventory', label: 'Inventory' },
  ];

  // Filter sections configuration
  const filterSections: FilterSection[] = [
    {
      id: 'dateRange',
      title: 'Date Range',
      type: 'dateRange',
      defaultValue: { from: dateFrom, to: dateTo }
    },
    {
      id: 'action',
      title: 'Action',
      type: 'checkbox',
      options: availableActions
    },
    {
      id: 'role',
      title: 'User Role',
      type: 'checkbox',
      options: availableRoles
    },
    {
      id: 'department',
      title: 'Department',
      type: 'checkbox',
      options: availableDepartments
    }
  ];

  // fetch function moved out so it can be retried from ErrorDisplay
  const fetchAuditLogs = async () => {
    try {
      // Build query parameters for backend pagination
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      // Add filters if they exist
      if (search) params.append('search', search);
      if (tableFilter) params.append('entity_type', tableFilter);
      if (actionFilter) params.append('action_type_code', actionFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (sortField) {
        params.append('sortBy', sortField);
        params.append('sortOrder', sortOrder);
      }

      const response = await fetch(`${API_BASE_URL}/api/audit-logs?${params.toString()}`);
      if (!response.ok) {
        throw new Error(response.statusText || 'Failed to fetch audit logs');
      }
      const data = await response.json();
      
      // Handle different response formats
      let logs = [];
      
      // Backend returns { success: true, data: [...], meta: {...} }
      if (data && data.success && Array.isArray(data.data)) {
        logs = data.data;
      } else if (data && Array.isArray(data.logs)) {
        logs = data.logs;
      } else if (Array.isArray(data)) {
        logs = data;
      } else if (data && Array.isArray(data.data)) {
        logs = data.data;
      } else if (data && data.success === false) {
        throw new Error(data.message || 'Failed to fetch audit logs');
      } else {
        console.warn('Unexpected response format:', data);
        setAuditLogs([]);
        return;
      }
      
      // Transform backend format to frontend format
      const transformedLogs = logs.map((log: Record<string, unknown>) => ({
        // Backend fields (schema-aligned)
        id: log.id,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        action_type_id: log.action_type_id,
        action_type_code: log.action_type_code,
        action_by: log.action_by,
        action_at: log.action_at,
        version: log.version,
        ip_address: log.ip_address,
        created_at: log.created_at,
        // Mapped fields for UI compatibility
        log_id: String(log.id),
        action: log.action_type_code,
        table_affected: log.entity_type,
        record_id: log.entity_id,
        performed_by: log.action_by || 'System',
        timestamp: log.action_at,
        details: `Version ${log.version} - ${log.action_type_code} on ${log.entity_type}`
      }));
      
      setAuditLogs(transformedLogs);
      
      // Extract total from backend metadata
      if (data && data.meta && typeof data.meta.total === 'number') {
        setTotalRecords(data.meta.total);
      } else {
        setTotalRecords(transformedLogs.length);
      }
    } catch (err: unknown) {
      console.error('Error fetching audit logs:', err);
      setAuditLogs([]); // Always set to empty array on error to prevent .filter() errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAuditLogs();
  }, [currentPage, pageSize, search, tableFilter, actionFilter, dateFrom, dateTo, sortField, sortOrder]);

  // Sort handler - will trigger useEffect to refetch
  const handleSort = (field: keyof AuditLog) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Backend handles pagination, filtering, and sorting
  // Display data directly from backend
  const currentRecords = auditLogs;
  const totalPages = Math.ceil(totalRecords / pageSize);

  const handleExport = async () => {
    try {
      // Check if there are records to export
      if (totalRecords === 0) {
        const warningResult = await showConfirmation(
          'No records found with the current filters. Do you want to proceed with exporting an empty dataset?',
          'Warning'
        );
        if (!warningResult.isConfirmed) {
          return;
        }
      }

      // Show export confirmation with details
      const confirmResult = await showConfirmation(`
        <div class="exportConfirmation">
          <p><strong>Date Range:</strong> ${dateFrom ? formatDateTime(dateFrom) : 'Start'} to ${dateTo ? formatDateTime(dateTo) : 'End'}</p>
          <p><strong>Table Filter:</strong> ${tableFilter || 'All Tables'}</p>
          <p><strong>Action Filter:</strong> ${actionFilter || 'All Actions'}</p>
          <p><strong>Role Filter:</strong> ${roleFilter || 'All Roles'}</p>
          <p><strong>Department Filter:</strong> ${departmentFilter || 'All Departments'}</p>
          <p><strong>Search Term:</strong> ${search || 'None'}</p>
          <p><strong>Number of Records:</strong> ${totalRecords}</p>
        </div>`,
        'Confirm Export'
      );

      if (!confirmResult.isConfirmed) {
        return;
      }

      // Show loading state
      Swal.fire({
        title: 'Exporting...',
        text: 'Please wait while we prepare your export.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Fetch ALL records for export (no pagination limit)
      const exportParams = new URLSearchParams({
        page: '1',
        limit: '10000', // Large limit to get all records
      });

      if (search) exportParams.append('search', search);
      if (tableFilter) exportParams.append('entity_type', tableFilter);
      if (actionFilter) exportParams.append('action_type_code', actionFilter);
      if (dateFrom) exportParams.append('dateFrom', dateFrom);
      if (dateTo) exportParams.append('dateTo', dateTo);

      const exportResponse = await fetch(`${API_BASE_URL}/api/audit-logs?${exportParams.toString()}`);
      if (!exportResponse.ok) throw new Error('Failed to fetch records for export');
      
      const exportResponseData = await exportResponse.json();
      const allLogs = exportResponseData.data || exportResponseData.logs || [];

      // Get export ID
      const exportIdResponse = await fetch(`${API_BASE_URL}/api/generate-export-id`);
      if (!exportIdResponse.ok) throw new Error('Failed to generate export ID');
      const { exportId } = await exportIdResponse.json();

      // Create audit log for export action
      await fetch(`${API_BASE_URL}/api/audit-logs/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'EXPORT',
          table_affected: 'AuditLog',
          record_id: exportId,
          details: `Exported audit logs with filters - Date Range: ${dateFrom || 'Start'} to ${dateTo || 'End'}, Table: ${tableFilter || 'All'}, Action: ${actionFilter || 'All'}, Role: ${roleFilter || 'All'}, Department: ${departmentFilter || 'All'}, Search: ${search || 'None'}, Records: ${allLogs.length}`
        }),
      });

      // Prepare data for export
      const exportData = allLogs.map((log: any) => ({
        'Date & Time': formatDateTime(log.action_at || log.timestamp),
        'Action': log.action_type_code || log.action,
        'Table': log.entity_type || log.table_affected,
        'Record ID': log.entity_id || log.record_id,
        'Performed By': log.action_by || log.performed_by,
        'IP Address': log.ip_address || 'N/A',
        'Details': `Version ${log.version} - ${log.action_type_code} on ${log.entity_type}`
      }));

      // Convert to CSV
      const headers = ['Date & Time', 'Action', 'Table', 'Record ID', 'Performed By', 'IP Address', 'Details'];
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => 
            JSON.stringify(row[header as keyof typeof row] || '')
          ).join(',')
        )
      ].join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `audit_logs_${exportId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      await showSuccess(`Successfully exported ${allLogs.length} records`, 'Export Complete!');
    } catch (error) {
      console.error('Export failed:', error);
      await showError('An error occurred while exporting the audit logs', 'Export Failed');
    }
  };

  // Handle filter application
  const handleFilterApply = (filterValues: Record<string, string | string[] | {from: string; to: string}>) => {
    // Date range filter
    if (filterValues.dateRange && typeof filterValues.dateRange === 'object') {
      const dateRange = filterValues.dateRange as { from: string; to: string };
      setDateFrom(dateRange.from);
      setDateTo(dateRange.to);
    }
    
    // Table filter (multiple selection support)
    if (filterValues.table && Array.isArray(filterValues.table)) {
      setTableFilter(filterValues.table.join(','));
    } else {
      setTableFilter('');
    }

    // Action filter
    if (filterValues.action && Array.isArray(filterValues.action)) {
      setActionFilter(filterValues.action.join(','));
    } else {
      setActionFilter('');
    }

    // Role filter
    if (filterValues.role && Array.isArray(filterValues.role)) {
      setRoleFilter(filterValues.role.join(','));
    } else {
      setRoleFilter('');
    }

    // Department filter
    if (filterValues.department && Array.isArray(filterValues.department)) {
      setDepartmentFilter(filterValues.department.join(','));
    } else {
      setDepartmentFilter('');
    }

    // Reset pagination page
    setCurrentPage(1);
  };


  if (loading) {
    return (
        <div className="card">
            <h1 className="title">Finance Tracking Management</h1>
            <Loading />
        </div>
    );
  }

  return (
    <div className="card">
      {/* <h1 className="title">Audit Logs</h1> */}
      <div className="elements">
        <h1 className="title">Audit Logs</h1>
        <div className="settings">
          <div className="search-filter-container">
            <div className="searchBar">
              <i className="ri-search-line" />
              <input
                type="text"
                placeholder="  Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              /> 
            </div>
            <FilterDropdown
              sections={filterSections}
              onApply={handleFilterApply}
              initialValues={{
                dateRange: { from: dateFrom, to: dateTo },
                action: actionFilter ? actionFilter.split(',') : [],
                role: roleFilter ? roleFilter.split(',') : [],
                department: departmentFilter ? departmentFilter.split(',') : []
              }}
            />
          </div>

          <div className="filters">
            <button onClick={handleExport} id="export"><i className="ri-receipt-line" /> Export Logs</button>
          </div>
        </div>
        <div className="table-wrapper">
          <div className="tableContainer">
            <table className="data-table">
            <thead>
              <tr>
                <th>No.</th>
                <th onClick={() => handleSort('timestamp')} className="sortable">
                  Date & Time
                  {sortField === 'timestamp' && (
                    <i className={`ri-arrow-${sortOrder === 'asc' ? 'up' : 'down'}-line`} />
                  )}
                </th>
                <th onClick={() => handleSort('action')} className="sortable">
                  Action
                  {sortField === 'action' && (
                    <i className={`ri-arrow-${sortOrder === 'asc' ? 'up' : 'down'}-line`} />
                  )}
                </th>
                <th onClick={() => handleSort('table_affected')} className="sortable">
                  Table
                  {sortField === 'table_affected' && (
                    <i className={`ri-arrow-${sortOrder === 'asc' ? 'up' : 'down'}-line`} />
                  )}
                </th>
                <th onClick={() => handleSort('record_id')} className="sortable">
                  Record ID
                  {sortField === 'record_id' && (
                    <i className={`ri-arrow-${sortOrder === 'asc' ? 'up' : 'down'}-line`} />
                  )}
                </th>
                <th onClick={() => handleSort('performed_by')} className="sortable">
                  Performed By
                  {sortField === 'performed_by' && (
                    <i className={`ri-arrow-${sortOrder === 'asc' ? 'up' : 'down'}-line`} />
                  )}
                </th>
                <th onClick={() => handleSort('ip_address')} className="sortable">
                  IP Address
                  {sortField === 'ip_address' && (
                    <i className={`ri-arrow-${sortOrder === 'asc' ? 'up' : 'down'}-line`} />
                  )}
                </th>
              </tr>
            </thead>
            <tbody>{currentRecords.map((log, index) => (
              <tr key={log.log_id} onClick={() => setSelectedLog(log)}>
                <td>{(currentPage - 1) * pageSize + index + 1}</td>
                <td>{formatDateTime(log.timestamp)}</td>
                <td>{log.action || 'N/A'}</td>
                <td>{formatDisplayText(log.table_affected || '')}</td>
                <td>{log.record_id || 'N/A'}</td>
                <td>{log.performed_by || 'N/A'}</td>
                <td>{log.ip_address || 'N/A'}</td>
              </tr>
            ))}</tbody></table>
            {currentRecords.length === 0 && <p className="noRecords">No audit logs found.</p>}
          </div>
        </div>
        <PaginationComponent
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
        {selectedLog && (
          <ViewDetailsModal
            log={selectedLog}
            onClose={() => setSelectedLog(null)}
          />
        )}
      </div>
    </div>
  );
};

export default AuditPage;