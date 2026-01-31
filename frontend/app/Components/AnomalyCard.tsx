import React, { useState } from 'react';
import { AnomalyAlert, AnomalySeverity } from '../types/anomaly';
import '../styles/anomaly.css';

interface Props {
    anomaly: AnomalyAlert;
    onResolve: (id: number, note: string) => void;
}

const AnomalyCard: React.FC<Props> = ({ anomaly, onResolve }) => {
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [resolutionNote, setResolutionNote] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const formatAnomalyType = (type: string) => {
        const names: Record<string, string> = {
            VOLUME_SPIKE: 'Unusual Activity Volume',
            OFF_HOURS: 'Off-Hours Activity',
            MASS_DELETE: 'Mass Delete Operation',
            RAPID_UPDATES: 'Rapid Entity Updates',
            FIRST_TIME_SPIKE: 'New User Activity Spike',
            SUSPICIOUS_PATTERN: 'Suspicious Pattern Detected'
        };
        return names[type] || type.replace(/_/g, ' ');
    };

    const handleResolve = () => {
        onResolve(anomaly.id, resolutionNote);
        setShowResolveModal(false);
        setResolutionNote('');
    };

    const suggestions = anomaly.ai_suggestions
        ? (typeof anomaly.ai_suggestions === 'string' ? JSON.parse(anomaly.ai_suggestions) : anomaly.ai_suggestions)
        : [];

    return (
        <div className={`anomaly-card ${anomaly.severity}`}>
            <div className="anomaly-card-header" onClick={() => setIsExpanded(!isExpanded)} style={{ cursor: 'pointer' }}>
                <div className="anomaly-type">
                    {formatAnomalyType(anomaly.anomaly_type)}
                    <span className={`risk-badge`}>{anomaly.severity} RISK</span>
                    {anomaly.is_resolved && <span className="resolved-badge">AG RESOLVED</span>}
                </div>
                <div className="anomaly-date">
                    {new Date(anomaly.created_at).toLocaleString()}
                </div>
            </div>

            {isExpanded && (
                <div className="anomaly-card-content">
                    <div className="ai-explanation">
                        <span className="ai-badge">AI ANALYSIS</span>
                        {anomaly.ai_explanation || 'No explanation available.'}
                        {anomaly.ai_risk_score && (
                            <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
                                Risk Score: <span style={{ color: anomaly.ai_risk_score > 75 ? 'red' : 'orange' }}>{anomaly.ai_risk_score}/100</span>
                            </div>
                        )}
                    </div>

                    <div className="anomaly-details">
                        <div className="detail-item">
                            <span className="detail-label">User</span>
                            <span className="detail-value">{anomaly.audit_log?.action_by || 'Unknown'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Action</span>
                            <span className="detail-value">{anomaly.audit_log?.action_type?.code || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Entity</span>
                            <span className="detail-value">{anomaly.audit_log?.entity_type} #{anomaly.audit_log?.entity_id}</span>
                        </div>
                    </div>

                    {suggestions && suggestions.length > 0 && (
                        <div style={{ marginTop: '15px' }}>
                            <h4 style={{ fontSize: '14px', marginBottom: '5px', color: '#555' }}>Recommended Actions:</h4>
                            <ul style={{ paddingLeft: '20px', fontSize: '13px', color: '#666' }}>
                                {Array.isArray(suggestions) && suggestions.map((s: string, i: number) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {!anomaly.is_resolved && (
                        <div className="anomaly-actions">
                            <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); setShowResolveModal(true); }}>
                                Resolve Alert
                            </button>
                        </div>
                    )}

                    {anomaly.is_resolved && (
                        <div className="anomaly-actions" style={{ justifyContent: 'flex-start', fontStyle: 'italic', fontSize: '12px' }}>
                            Resolved by {anomaly.resolved_by} on {new Date(anomaly.resolved_at!).toLocaleString()}
                            {anomaly.resolution_note && ` - Note: ${anomaly.resolution_note}`}
                        </div>
                    )}
                </div>
            )}

            {showResolveModal && (
                <div className="modal-overlay" onClick={() => setShowResolveModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>Resolve Anomaly</h2>
                        <p>Add a note about how this was resolved:</p>
                        <textarea
                            value={resolutionNote}
                            onChange={e => setResolutionNote(e.target.value)}
                            placeholder="e.g., Confirmed with user, false positive..."
                        />
                        <div className="modal-actions">
                            <button className="btn btn-outline" onClick={() => setShowResolveModal(false)}>Cancel</button>
                            <button className="btn btn-resolve" onClick={handleResolve}>Mark Resolved</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnomalyCard;
