'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AnomalyAlert, AnomalyStats as StatsType } from '../../types/anomaly';
import ModalManager from '../../Components/modalManager';
import ViewAnomalyDetailsModal from '../../Components/ViewAnomalyDetailsModal';
import { BackButton } from '../../Components/backButton';
import Loading from '../../Components/loading';
import PaginationComponent from '../../Components/pagination';
import FilterDropdown, { FilterSection } from '../../Components/filter';
import '../../styles/components/table.css';
import '../../globals.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

export default function AnomaliesPage() {
    const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterSeverity, setFilterSeverity] = useState('');
    const [filterResolved, setFilterResolved] = useState('false');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<React.ReactNode>(null);

    // Fetch Anomalies
    useEffect(() => {
        const fetchAnomalies = async () => {
            setLoading(true);
            try {
                const params: any = {
                    page: currentPage,
                    limit: pageSize
                };
                if (filterSeverity) params.severity = filterSeverity;
                if (filterResolved !== 'all') params.is_resolved = filterResolved;
                if (search) params.search = search;

                const res = await axios.get(`${API_URL}/anomalies`, { params });
                if (res.data.success) {
                    setAnomalies(res.data.data);
                    // Assuming backend returns pagination metadata, if not handling manually
                    setTotalRecords(res.data.meta?.total || res.data.data.length);
                }
            } catch (error) {
                console.error('Failed to fetch anomalies', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnomalies();
    }, [filterSeverity, filterResolved, search, refreshTrigger, currentPage, pageSize]);

    const handleSearchSubmit = () => {
        setSearch(searchInput.trim());
        setCurrentPage(1);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearchSubmit();
        }
    };

    const handleClearSearch = () => {
        setSearchInput('');
        setSearch('');
        setCurrentPage(1);
    };

    const handleResolve = async (id: number, note: string) => {
        try {
            await axios.patch(`${API_URL}/anomalies/${id}/resolve`, { resolution_note: note });
            // Refresh data and keep modal open? No, modal handles closing or we close it.
            setRefreshTrigger(prev => prev + 1);
            // alert('Anomaly resolved successfully.');
        } catch (error) {
            console.error('Failed to resolve anomaly', error);
            alert('Failed to resolve anomaly.');
        }
    };

    const openViewModal = (anomaly: AnomalyAlert) => {
        setModalContent(
            <ViewAnomalyDetailsModal
                data={anomaly}
                onClose={() => setIsModalOpen(false)}
                onResolve={handleResolve}
            />
        );
        setIsModalOpen(true);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const filterSections: FilterSection[] = [
        {
            id: 'severity',
            title: 'Severity',
            type: 'radio',
            options: [
                { id: '', label: 'All Severities' },
                { id: 'CRITICAL', label: 'Critical' },
                { id: 'HIGH', label: 'High' },
                { id: 'MEDIUM', label: 'Medium' },
                { id: 'LOW', label: 'Low' }
            ],
            defaultValue: ''
        },
        {
            id: 'status',
            title: 'Status',
            type: 'radio',
            options: [
                { id: 'false', label: 'Unresolved' },
                { id: 'true', label: 'Resolved' },
                { id: 'all', label: 'All Status' }
            ],
            defaultValue: 'false'
        }
    ];

    const handleFilterApply = (filterValues: Record<string, string | string[] | { from: string; to: string }>) => {
        if (typeof filterValues.severity === 'string') {
            setFilterSeverity(filterValues.severity);
        }
        if (typeof filterValues.status === 'string') {
            setFilterResolved(filterValues.status);
        }
        setCurrentPage(1); // Reset pagination
    };

    if (loading) {
        return (
            <>
                <div style={{ display: 'flex', flex: 1, width: '100%', paddingLeft: 30, paddingTop: 10, paddingBottom: 10 }}>
                    <div style={{ display: 'flex', top: '1rem', left: '1rem', zIndex: 10 }}>
                        <BackButton variant="default" size="default" href={process.env.NEXT_PUBLIC_MAIN_FRONTEND || '/audit'} aria-label="Go back" />
                    </div>
                </div>
                <div className="card">
                    <h1 className="title">Anomaly Detection Dashboard</h1>
                    <Loading />
                </div>
            </>
        );
    }

    return (
        <>
            {/* Back Button */}
            <div style={{ display: 'flex', flex: 1, width: '100%', paddingLeft: 30, paddingTop: 10, paddingBottom: 10 }}>
                <div style={{ display: 'flex', top: '1rem', left: '1rem', zIndex: 10, marginBottom: '10px' }}>
                    <BackButton variant="default" size="default" href="/audit" aria-label="Go back" />
                </div>
            </div>

            <div className="card">
                <div className="elements">
                    <h1 className="title" style={{ fontSize: '24px', fontWeight: 600, marginBottom: '15px' }}>Anomaly Detection Dashboard</h1>

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
                                    severity: filterSeverity,
                                    status: filterResolved
                                }}
                            />
                        </div>

                        <div className="filters">
                            <button
                                onClick={() => window.location.href = '/settings/notifications'}
                                style={{
                                    height: '35px', padding: '0 15px', borderRadius: '8px',
                                    backgroundColor: 'var(--secondary-color)', color: 'white', border: 'none',
                                    fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                                }}
                            >
                                <i className="ri-settings-3-line"></i> Settings
                            </button>
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <div className="tableContainer">
                            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th>Date Detected</th>
                                        <th>Type</th>
                                        <th>Risk Score</th>
                                        <th>Severity</th>
                                        <th>User</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {anomalies.length === 0 ? (
                                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }} className="noRecords">No anomalies found.</td></tr>
                                    ) : (
                                        anomalies.map((anomaly) => (
                                            <tr key={anomaly.id}>
                                                <td>{formatDate(anomaly.created_at)}</td>
                                                <td>{anomaly.anomaly_type.replace(/_/g, ' ')}</td>
                                                <td>{anomaly.ai_risk_score ? `${anomaly.ai_risk_score}/100` : 'N/A'}</td>
                                                <td>
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                                                        backgroundColor: `var(--${anomaly.severity === 'CRITICAL' ? 'error' : anomaly.severity === 'HIGH' ? 'warning' : 'info'}-chip-bg-color)`,
                                                        color: `var(--${anomaly.severity === 'CRITICAL' ? 'error' : anomaly.severity === 'HIGH' ? 'warning' : 'info'}-chip-text-color)`
                                                    }}>
                                                        {anomaly.severity}
                                                    </span>
                                                </td>
                                                <td>{anomaly.audit_log?.action_by || 'System'}</td>
                                                <td>
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                                                        backgroundColor: anomaly.is_resolved ? 'var(--success-chip-bg-color)' : 'var(--error-chip-bg-color)',
                                                        color: anomaly.is_resolved ? 'var(--success-chip-text-color)' : 'var(--error-chip-text-color)'
                                                    }}>
                                                        {anomaly.is_resolved ? 'RESOLVED' : 'UNRESOLVED'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => openViewModal(anomaly)}
                                                        style={{
                                                            backgroundColor: 'var(--success-color)', color: 'white', border: 'none',
                                                            borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontSize: '14px'
                                                        }}
                                                        title="View Details"
                                                    >
                                                        <i className="ri-eye-line"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <PaginationComponent
                        currentPage={currentPage}
                        totalPages={Math.ceil(totalRecords / pageSize)}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                    />
                </div>
            </div>

            <ModalManager
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                modalContent={modalContent}
            />
        </>
    );
}
