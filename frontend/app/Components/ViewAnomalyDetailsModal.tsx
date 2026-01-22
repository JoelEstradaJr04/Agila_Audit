import React from 'react';
import '../styles/components/forms.css'; // Import form styles
import { AnomalyAlert } from '../types/anomaly';

interface Props {
    data: AnomalyAlert;
    onClose: () => void;
    onResolve?: (id: number, note: string) => void;
}

const ViewAnomalyDetailsModal: React.FC<Props> = ({ data, onClose, onResolve }) => {
    const [resolutionNote, setResolutionNote] = React.useState('');
    const [showResolveInput, setShowResolveInput] = React.useState(false);

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
        });
    };

    const explanations = data.ai_explanation || 'No analysis available.';
    const suggestions = typeof data.ai_suggestions === 'string'
        ? JSON.parse(data.ai_suggestions)
        : (data.ai_suggestions || []);

    const handleResolveClick = () => {
        if (onResolve && resolutionNote.trim()) {
            onResolve(data.id, resolutionNote);
            onClose();
        }
    };

    return (
        <>
            <div className="modal-heading">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2 className="modal-title">View Anomaly Details</h2>
                    <div className={`risk-badge ${data.severity}`} style={{
                        width: 'fit-content', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', marginTop: '5px',
                        backgroundColor: `var(--${data.severity === 'CRITICAL' ? 'error' : data.severity === 'HIGH' ? 'warning' : 'info'}-chip-bg-color)`,
                        color: `var(--${data.severity === 'CRITICAL' ? 'error' : data.severity === 'HIGH' ? 'warning' : 'info'}-chip-text-color)`
                    }}>
                        {data.severity} RISK
                    </div>
                </div>
                <div className="modal-date-time">
                    <div>{formatDateTime(data.created_at)}</div>
                    <button className="close-modal-btn" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
                </div>
            </div>

            <div className="modal-content view">
                <div className="view-form">
                    <div className="form-group">
                        <label>Anomaly Type</label>
                        <input type="text" value={data.anomaly_type.replace(/_/g, ' ')} disabled />
                    </div>
                </div>
                <div className="view-form">
                    <div className="form-group">
                        <label>Status</label>
                        <div style={{
                            padding: '6px 12px', borderRadius: '6px', fontSize: '14px', textAlign: 'center', marginTop: '5px',
                            backgroundColor: data.is_resolved ? 'var(--success-chip-bg-color)' : 'var(--error-chip-bg-color)',
                            color: data.is_resolved ? 'var(--success-chip-text-color)' : 'var(--error-chip-text-color)'
                        }}>
                            {data.is_resolved ? 'Resolved' : 'Unresolved'}
                        </div>
                    </div>
                </div>
            </div>

            <p className="details-title">I. AI Analysis</p>
            <div className="modal-content add">
                <div className="form-group">
                    <label>Explanation</label>
                    <textarea disabled value={explanations} style={{ height: '100px' }}></textarea>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Risk Score</label>
                        <input type="text" value={`${data.ai_risk_score}/100`} disabled />
                    </div>
                    <div className="form-group">
                        <label>Detected At</label>
                        <input type="text" value={formatDateTime(data.created_at)} disabled />
                    </div>
                </div>
                {suggestions.length > 0 && (
                    <div className="form-group">
                        <label>Suggestions</label>
                        <textarea disabled value={suggestions.join('\n')} style={{ height: '80px' }}></textarea>
                    </div>
                )}
            </div>

            <p className="details-title">II. Context Information</p>
            <div className="modal-content add">
                <div className="form-row">
                    <div className="form-group">
                        <label>Performed By</label>
                        <input type="text" value={data.audit_log?.action_by || 'System'} disabled />
                    </div>
                    <div className="form-group">
                        <label>Action</label>
                        <input type="text" value={data.audit_log?.action_type?.code || 'N/A'} disabled />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Entity Type</label>
                        <input type="text" value={data.audit_log?.entity_type} disabled />
                    </div>
                    <div className="form-group">
                        <label>Record ID</label>
                        <input type="text" value={data.audit_log?.entity_id} disabled />
                    </div>
                </div>
            </div>

            {data.is_resolved && (
                <>
                    <p className="details-title">III. Resolution Details</p>
                    <div className="modal-content add">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Resolved By</label>
                                <input type="text" value={data.resolved_by || 'Unknown'} disabled />
                            </div>
                            <div className="form-group">
                                <label>Date Resolved</label>
                                <input type="text" value={data.resolved_at ? formatDateTime(data.resolved_at) : '-'} disabled />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Resolution Note</label>
                            <textarea disabled value={data.resolution_note || '-'}></textarea>
                        </div>
                    </div>
                </>
            )}

            <div className="modal-actions">
                {!data.is_resolved && onResolve && (
                    !showResolveInput ? (
                        <button className="submit-btn" onClick={() => setShowResolveInput(true)}>
                            Resolve Alert
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', width: '100%' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Resolution Note</label>
                                <input
                                    type="text"
                                    placeholder="Reason for resolution..."
                                    value={resolutionNote}
                                    onChange={(e) => setResolutionNote(e.target.value)}
                                />
                            </div>
                            <button className="submit-btn" style={{ height: '35px', marginBottom: '1px' }} onClick={handleResolveClick}>
                                Confirm
                            </button>
                            <button className="cancel-btn" style={{ height: '35px', marginBottom: '1px' }} onClick={() => setShowResolveInput(false)}>
                                Cancel
                            </button>
                        </div>
                    )
                )}
                <button className="cancel-btn" onClick={onClose}>Close</button>
            </div>
        </>
    );
};

export default ViewAnomalyDetailsModal;
