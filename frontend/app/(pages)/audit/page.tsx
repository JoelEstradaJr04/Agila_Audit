"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import '@app/styles/Components/table.css';
import "@app/styles/audit/audit.css";
import PaginationComponent from "@app/Components/pagination";
import Swal from "sweetalert2";
import Loading from '@app/Components/loading';
import { showSuccess, showError, showConfirmation } from '@app/utils/Alerts';
import { formatDisplayText } from '@/app/utils/formatting';
import FilterDropdown, { FilterSection } from "@app/Components/filter";
import { BackButton } from "@app/Components/backButton";
import ExportButton from "@app/Components/ExportButton";

// Backend API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002';

type AuditLog = {
  // Backend fields (from schema)
  id: number;
  entity_type: string;
  entity_id: string;
  action_type_id: number;
  action_type_code: string;
  action_by: string | null;
  action_at: string;
  previous_data?: any | null;
  new_data?: any | null;
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
      case 'ARCHIVE': return '📦';
      case 'UNARCHIVE': return '📂';
      case 'EXPORT': return '📤';
      case 'IMPORT': return '📥';
      case 'LOGIN': return '🔓';
      case 'LOGOUT': return '🔒';
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
  const router = useRouter();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(""); // Input field value
  const [search, setSearch] = useState(""); // Applied search filter (triggers fetch)
  const [tableFilter, setTableFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [selectedLogDetails, setSelectedLogDetails] = useState<AuditLog | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  // Default sorting: newest first (descending by timestamp)
  const [sortField, setSortField] = useState<keyof AuditLog | null>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Handle search submission (Enter key or button click)
  const handleSearchSubmit = () => {
    setSearch(searchInput.trim());
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle Enter key press in search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setCurrentPage(1);
  };

  // Available actions for filtering (matches Action column in table)
  const availableActions = [
    { id: 'CREATE', label: 'Create' },
    { id: 'UPDATE', label: 'Update' },
    { id: 'DELETE', label: 'Delete' },
    { id: 'ARCHIVE', label: 'Archive' },
    { id: 'UNARCHIVE', label: 'Unarchive' },
    { id: 'EXPORT', label: 'Export' },
    { id: 'IMPORT', label: 'Import' },
    { id: 'LOGIN', label: 'Login' },
    { id: 'LOGOUT', label: 'Logout' }
  ];

  // Available tables for filtering (matches Table column in table)
  const availableTables = [
    { id: 'ExpenseRecord', label: 'Expense Record' },
    { id: 'RevenueRecord', label: 'Revenue Record' },
    { id: 'Receipt', label: 'Receipt' },
    { id: 'Reimbursement', label: 'Reimbursement' },
    { id: 'Asset', label: 'Asset' },
    { id: 'Budget', label: 'Budget' },
    { id: 'JournalEntry', label: 'Journal Entry' },
    { id: 'AuditLog', label: 'Audit Log' },
  ];

  // Filter sections configuration - only includes fields that match table headers
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
      id: 'table',
      title: 'Table',
      type: 'checkbox',
      options: availableTables
    }
  ];

  // Fetch full audit log details by ID
  const fetchAuditLogDetails = async (logId: string) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/audit-logs/${logId}`,
        {
          headers: {
            'x-api-key': 'FINANCE_DEFAULT_KEY',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch audit log details: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to fetch audit log details');
      }

      const log = result.data;
      
      // Transform the full audit log data
      const transformedLog: AuditLog = {
        id: log.id,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        action_type_id: log.action_type_id,
        action_type_code: log.action_type?.code || 'UNKNOWN',
        action_by: log.action_by,
        action_at: log.action_at,
        previous_data: log.previous_data,
        new_data: log.new_data,
        version: log.version,
        ip_address: log.ip_address,
        created_at: log.created_at,
        // Mapped fields
        log_id: String(log.id),
        action: log.action_type?.code || 'UNKNOWN',
        table_affected: log.entity_type,
        record_id: log.entity_id,
        performed_by: log.action_by || 'System',
        timestamp: log.action_at,
        // Use backend-generated details with full data context
        details: log.details || `Version ${log.version} - ${log.action_type?.code} on ${log.entity_type}`
      };

      setSelectedLogDetails(transformedLog);
    } catch (err: unknown) {
      console.error('Error fetching audit log details:', err);
      // Show error to user
      showError('Failed to load audit log details. Please try again.', 'Error');
      setSelectedLogDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

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
      
      // Map frontend field names to backend field names for sorting
      if (sortField) {
        const fieldMapping: Record<string, string> = {
          'timestamp': 'action_at',
          'action': 'action_type_code',
          'table_affected': 'entity_type',
          'record_id': 'entity_id',
          'performed_by': 'action_by',
          'ip_address': 'ip_address'
        };
        const backendSortField = fieldMapping[sortField] || sortField;
        params.append('sortBy', backendSortField);
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
        // Use backend-generated details (single source of truth)
        details: log.details || `Version ${log.version} - ${log.action_type_code} on ${log.entity_type}`
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

  // Prepare export data for the ExportButton component
  const exportData = auditLogs.map(log => ({
    date_time: formatDateTime(log.timestamp),
    action: log.action || 'N/A',
    table: formatDisplayText(log.table_affected || ''),
    record_id: log.record_id || 'N/A',
    performed_by: log.performed_by || 'N/A',
    ip_address: log.ip_address || 'N/A',
    details: log.details || 'N/A'
  }));

  // Column configuration for export
  const exportColumns = [
    { header: 'Date & Time', key: 'date_time' },
    { header: 'Action', key: 'action' },
    { header: 'Table', key: 'table' },
    { header: 'Record ID', key: 'record_id' },
    { header: 'Performed By', key: 'performed_by' },
    { header: 'IP Address', key: 'ip_address' },
    { header: 'Details', key: 'details' }
  ];

  // Handle filter application - only includes filters that match table headers
  const handleFilterApply = (filterValues: Record<string, string | string[] | {from: string; to: string}>) => {
    // Date range filter (matches Date & Time column)
    if (filterValues.dateRange && typeof filterValues.dateRange === 'object') {
      const dateRange = filterValues.dateRange as { from: string; to: string };
      setDateFrom(dateRange.from);
      setDateTo(dateRange.to);
    } else {
      setDateFrom('');
      setDateTo('');
    }
    
    // Table filter (matches Table column)
    if (filterValues.table && Array.isArray(filterValues.table) && filterValues.table.length > 0) {
      setTableFilter(filterValues.table.join(','));
    } else {
      setTableFilter('');
    }

    // Action filter (matches Action column)
    if (filterValues.action && Array.isArray(filterValues.action) && filterValues.action.length > 0) {
      setActionFilter(filterValues.action.join(','));
    } else {
      setActionFilter('');
    }

    // Reset pagination page when filters change
    setCurrentPage(1);
  };


  if (loading) {
    return (
      <>
      {/* Back Button */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          margin: 10,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 28,
          zIndex: 10,
          paddingLeft: 30
        }}>
          <button
            onClick={() => router.back()}
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 28,
              zIndex: 10
            }}
            aria-label="Go back"
          >
            <i className="ri-arrow-left-long-line"></i>
          </button>
        </div>
        <div className="card">
            <h1 className="title">Finance Tracking Management</h1>
            <Loading />
        </div>
      </>
        
    );
  }

  return (
    <>
      {/* Back Button */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        margin: 10,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: 28,
        zIndex: 10,
        paddingLeft: 30
      }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 28,
            zIndex: 10
          }}
          aria-label="Go back"
        >
          <i className="ri-arrow-left-long-line"></i>
        </button>
      </div>
      <div className="card">
        {/* <h1 className="title">Audit Logs</h1> */}
        <div className="elements">
        <h1 className="title">Audit Logs</h1>
        <div className="settings">
          <div className="search-filter-container">
            <div className="searchBar">
              <i className="ri-search-line" onClick={handleSearchSubmit} style={{ cursor: 'pointer' }} />
              <input
                type="text"
                placeholder="  Search by Action, Table, Record ID, Performed By... (Press Enter)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              {searchInput && (
                <i 
                  className="ri-close-line" 
                  onClick={handleClearSearch} 
                  style={{ cursor: 'pointer', marginLeft: '8px' }} 
                />
              )}
            </div>
            <FilterDropdown
              sections={filterSections}
              onApply={handleFilterApply}
              initialValues={{
                dateRange: { from: dateFrom, to: dateTo },
                action: actionFilter ? actionFilter.split(',') : [],
                table: tableFilter ? tableFilter.split(',') : []
              }}
            />
          </div>

          <div className="filters">
            <ExportButton
              data={exportData}
              filename="audit_logs"
              columns={exportColumns}
              title="Audit Logs Export"
            />
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
              <tr key={log.log_id} onClick={() => {
                setSelectedLog(log);
                if (log.log_id) {
                  fetchAuditLogDetails(log.log_id);
                }
              }}>
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
            log={loadingDetails ? selectedLog : (selectedLogDetails || selectedLog)}
            onClose={() => {
              setSelectedLog(null);
              setSelectedLogDetails(null);
            }}
          />
        )}
      </div>
    </div>
    </>
    </>
  );
};

export default AuditPage;