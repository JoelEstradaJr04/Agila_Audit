'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/components/forms.css';
import { showEmptyFieldWarning, showError, showSuccess } from '../utils/Alerts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

// Rule configuration types
interface VolumeRuleConfig {
    threshold: number;
    timeWindowMinutes: number;
}

interface OffHoursRuleConfig {
    workHoursStart: number;
    workHoursEnd: number;
    workDays: number[];
}

interface MassDeleteRuleConfig {
    threshold: number;
    timeWindowMinutes: number;
}

interface RapidUpdatesRuleConfig {
    threshold: number;
    timeWindowMinutes: number;
}

interface AnomalyRule {
    id: number;
    rule_code: string;
    rule_name: string;
    description: string | null;
    rule_config: VolumeRuleConfig | OffHoursRuleConfig | MassDeleteRuleConfig | RapidUpdatesRuleConfig;
    default_severity: string;
    is_active: boolean;
}

interface Props {
    onClose: () => void;
}

const DAYS_OF_WEEK = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' }
];

const SEVERITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const AnomalyRulesModal: React.FC<Props> = ({ onClose }) => {
    const [rules, setRules] = useState<AnomalyRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('VOLUME_SPIKE');
    const [hasChanges, setHasChanges] = useState(false);

    // Fetch rules on mount
    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/anomaly-rules`);
            if (res.data.success) {
                // If no rules exist, seed defaults first
                if (res.data.data.length === 0) {
                    await axios.post(`${API_URL}/anomaly-rules/seed-defaults`);
                    const seededRes = await axios.get(`${API_URL}/anomaly-rules`);
                    setRules(seededRes.data.data);
                } else {
                    setRules(res.data.data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch rules:', error);
            showError('Failed to load anomaly rules', 'Error');
        } finally {
            setLoading(false);
        }
    };

    const getRule = (code: string): AnomalyRule | undefined => {
        return rules.find(r => r.rule_code === code);
    };

    const updateRuleConfig = (code: string, configUpdate: Partial<any>) => {
        setRules(prev => prev.map(rule => {
            if (rule.rule_code === code) {
                return {
                    ...rule,
                    rule_config: { ...rule.rule_config, ...configUpdate }
                };
            }
            return rule;
        }));
        setHasChanges(true);
    };

    const updateRuleSeverity = (code: string, severity: string) => {
        setRules(prev => prev.map(rule => {
            if (rule.rule_code === code) {
                return { ...rule, default_severity: severity };
            }
            return rule;
        }));
        setHasChanges(true);
    };

    const updateRuleActive = (code: string, isActive: boolean) => {
        setRules(prev => prev.map(rule => {
            if (rule.rule_code === code) {
                return { ...rule, is_active: isActive };
            }
            return rule;
        }));
        setHasChanges(true);
    };

    const validateRules = (): boolean => {
        for (const rule of rules) {
            const config = rule.rule_config as any;

            if (rule.rule_code === 'OFF_HOURS') {
                const offHoursConfig = config as OffHoursRuleConfig;
                if (offHoursConfig.workHoursStart < 0 || offHoursConfig.workHoursStart > 23) {
                    showError('Work hours start must be between 0 and 23', 'Invalid Configuration');
                    setActiveTab('OFF_HOURS');
                    return false;
                }
                if (offHoursConfig.workHoursEnd < 0 || offHoursConfig.workHoursEnd > 23) {
                    showError('Work hours end must be between 0 and 23', 'Invalid Configuration');
                    setActiveTab('OFF_HOURS');
                    return false;
                }
                if (offHoursConfig.workHoursStart >= offHoursConfig.workHoursEnd) {
                    showError('Work hours start must be before end time', 'Invalid Configuration');
                    setActiveTab('OFF_HOURS');
                    return false;
                }
                if (!offHoursConfig.workDays || offHoursConfig.workDays.length === 0) {
                    showError('At least one work day must be selected', 'Invalid Configuration');
                    setActiveTab('OFF_HOURS');
                    return false;
                }
            } else {
                // For threshold-based rules
                if (config.threshold !== undefined && (config.threshold < 1 || config.threshold > 1000)) {
                    showError(`Threshold must be between 1 and 1000 for ${rule.rule_name}`, 'Invalid Configuration');
                    setActiveTab(rule.rule_code);
                    return false;
                }
                if (config.timeWindowMinutes !== undefined && (config.timeWindowMinutes < 1 || config.timeWindowMinutes > 1440)) {
                    showError(`Time window must be between 1 and 1440 minutes for ${rule.rule_name}`, 'Invalid Configuration');
                    setActiveTab(rule.rule_code);
                    return false;
                }
            }
        }
        return true;
    };

    const handleSave = async () => {
        if (!validateRules()) return;

        setSaving(true);
        try {
            // Save each rule
            for (const rule of rules) {
                await axios.patch(`${API_URL}/anomaly-rules/${rule.id}`, {
                    rule_config: rule.rule_config,
                    default_severity: rule.default_severity,
                    is_active: rule.is_active
                });
            }
            showSuccess('Anomaly detection rules saved successfully', 'Saved');
            setHasChanges(false);
            onClose();
        } catch (error: any) {
            console.error('Failed to save rules:', error);
            showError(error.response?.data?.error || 'Failed to save rules', 'Error');
        } finally {
            setSaving(false);
        }
    };

    // Render rule configuration based on type
    const renderVolumeSpike = () => {
        const rule = getRule('VOLUME_SPIKE');
        if (!rule) return null;
        const config = rule.rule_config as VolumeRuleConfig;

        return (
            <div className="rule-config-section">
                <div className="rule-header">
                    <div className="rule-info">
                        <h3>{rule.rule_name}</h3>
                        <p className="rule-description">{rule.description}</p>
                    </div>
                    <div className="checkbox-wrapper" style={{ background: 'var(--foreground-color)' }}>
                        <input
                            type="checkbox"
                            checked={rule.is_active}
                            onChange={(e) => updateRuleActive('VOLUME_SPIKE', e.target.checked)}
                            disabled={saving}
                        />
                        <label>Enable Rule</label>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Action Threshold <span className="requiredTags">*</span></label>
                        <input
                            type="number"
                            min="1"
                            max="1000"
                            value={config.threshold}
                            onChange={(e) => updateRuleConfig('VOLUME_SPIKE', { threshold: parseInt(e.target.value) || 1 })}
                            disabled={saving || !rule.is_active}
                        />
                        <span className="hint-message">Number of actions to trigger alert</span>
                    </div>
                    <div className="form-group">
                        <label>Time Window (minutes) <span className="requiredTags">*</span></label>
                        <input
                            type="number"
                            min="1"
                            max="1440"
                            value={config.timeWindowMinutes}
                            onChange={(e) => updateRuleConfig('VOLUME_SPIKE', { timeWindowMinutes: parseInt(e.target.value) || 1 })}
                            disabled={saving || !rule.is_active}
                        />
                        <span className="hint-message">Time period to count actions (1-1440 mins)</span>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Default Severity</label>
                        <select
                            value={rule.default_severity}
                            onChange={(e) => updateRuleSeverity('VOLUME_SPIKE', e.target.value)}
                            disabled={saving || !rule.is_active}
                        >
                            {SEVERITY_OPTIONS.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        );
    };

    const renderOffHours = () => {
        const rule = getRule('OFF_HOURS');
        if (!rule) return null;
        const config = rule.rule_config as OffHoursRuleConfig;

        const toggleWorkDay = (day: number) => {
            const currentDays = config.workDays || [];
            const newDays = currentDays.includes(day)
                ? currentDays.filter(d => d !== day)
                : [...currentDays, day].sort((a, b) => a - b);
            updateRuleConfig('OFF_HOURS', { workDays: newDays });
        };

        return (
            <div className="rule-config-section">
                <div className="rule-header">
                    <div className="rule-info">
                        <h3>{rule.rule_name}</h3>
                        <p className="rule-description">{rule.description}</p>
                    </div>
                    <div className="checkbox-wrapper" style={{ background: 'var(--foreground-color)' }}>
                        <input
                            type="checkbox"
                            checked={rule.is_active}
                            onChange={(e) => updateRuleActive('OFF_HOURS', e.target.checked)}
                            disabled={saving}
                        />
                        <label>Enable Rule</label>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Work Hours Start (24h) <span className="requiredTags">*</span></label>
                        <input
                            type="number"
                            min="0"
                            max="23"
                            value={config.workHoursStart}
                            onChange={(e) => updateRuleConfig('OFF_HOURS', { workHoursStart: parseInt(e.target.value) || 0 })}
                            disabled={saving || !rule.is_active}
                        />
                        <span className="hint-message">e.g., 8 for 8:00 AM</span>
                    </div>
                    <div className="form-group">
                        <label>Work Hours End (24h) <span className="requiredTags">*</span></label>
                        <input
                            type="number"
                            min="0"
                            max="23"
                            value={config.workHoursEnd}
                            onChange={(e) => updateRuleConfig('OFF_HOURS', { workHoursEnd: parseInt(e.target.value) || 0 })}
                            disabled={saving || !rule.is_active}
                        />
                        <span className="hint-message">e.g., 18 for 6:00 PM</span>
                    </div>
                </div>

                <div className="form-group">
                    <label>Work Days <span className="requiredTags">*</span></label>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                        {DAYS_OF_WEEK.map(day => (
                            <button
                                key={day.value}
                                type="button"
                                onClick={() => toggleWorkDay(day.value)}
                                disabled={saving || !rule.is_active}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: saving || !rule.is_active ? 'not-allowed' : 'pointer',
                                    backgroundColor: (config.workDays || []).includes(day.value)
                                        ? 'var(--primary-color)'
                                        : 'var(--foreground-color)',
                                    color: (config.workDays || []).includes(day.value)
                                        ? 'white'
                                        : 'var(--primary-text-color)',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    transition: 'all 0.2s ease',
                                    opacity: saving || !rule.is_active ? 0.5 : 1
                                }}
                            >
                                {day.label}
                            </button>
                        ))}
                    </div>
                    <span className="hint-message">Select which days are considered working days</span>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Default Severity</label>
                        <select
                            value={rule.default_severity}
                            onChange={(e) => updateRuleSeverity('OFF_HOURS', e.target.value)}
                            disabled={saving || !rule.is_active}
                        >
                            {SEVERITY_OPTIONS.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        );
    };

    const renderMassDelete = () => {
        const rule = getRule('MASS_DELETE');
        if (!rule) return null;
        const config = rule.rule_config as MassDeleteRuleConfig;

        return (
            <div className="rule-config-section">
                <div className="rule-header">
                    <div className="rule-info">
                        <h3>{rule.rule_name}</h3>
                        <p className="rule-description">{rule.description}</p>
                    </div>
                    <div className="checkbox-wrapper" style={{ background: 'var(--foreground-color)' }}>
                        <input
                            type="checkbox"
                            checked={rule.is_active}
                            onChange={(e) => updateRuleActive('MASS_DELETE', e.target.checked)}
                            disabled={saving}
                        />
                        <label>Enable Rule</label>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Delete Threshold <span className="requiredTags">*</span></label>
                        <input
                            type="number"
                            min="1"
                            max="1000"
                            value={config.threshold}
                            onChange={(e) => updateRuleConfig('MASS_DELETE', { threshold: parseInt(e.target.value) || 1 })}
                            disabled={saving || !rule.is_active}
                        />
                        <span className="hint-message">Number of deletes to trigger alert</span>
                    </div>
                    <div className="form-group">
                        <label>Time Window (minutes) <span className="requiredTags">*</span></label>
                        <input
                            type="number"
                            min="1"
                            max="1440"
                            value={config.timeWindowMinutes}
                            onChange={(e) => updateRuleConfig('MASS_DELETE', { timeWindowMinutes: parseInt(e.target.value) || 1 })}
                            disabled={saving || !rule.is_active}
                        />
                        <span className="hint-message">Time period to count deletes (1-1440 mins)</span>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Default Severity</label>
                        <select
                            value={rule.default_severity}
                            onChange={(e) => updateRuleSeverity('MASS_DELETE', e.target.value)}
                            disabled={saving || !rule.is_active}
                        >
                            {SEVERITY_OPTIONS.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        );
    };

    const renderRapidUpdates = () => {
        const rule = getRule('RAPID_UPDATES');
        if (!rule) return null;
        const config = rule.rule_config as RapidUpdatesRuleConfig;

        return (
            <div className="rule-config-section">
                <div className="rule-header">
                    <div className="rule-info">
                        <h3>{rule.rule_name}</h3>
                        <p className="rule-description">{rule.description}</p>
                    </div>
                    <div className="checkbox-wrapper" style={{ background: 'var(--foreground-color)' }}>
                        <input
                            type="checkbox"
                            checked={rule.is_active}
                            onChange={(e) => updateRuleActive('RAPID_UPDATES', e.target.checked)}
                            disabled={saving}
                        />
                        <label>Enable Rule</label>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Update Threshold <span className="requiredTags">*</span></label>
                        <input
                            type="number"
                            min="1"
                            max="1000"
                            value={config.threshold}
                            onChange={(e) => updateRuleConfig('RAPID_UPDATES', { threshold: parseInt(e.target.value) || 1 })}
                            disabled={saving || !rule.is_active}
                        />
                        <span className="hint-message">Number of updates to same entity to trigger</span>
                    </div>
                    <div className="form-group">
                        <label>Time Window (minutes) <span className="requiredTags">*</span></label>
                        <input
                            type="number"
                            min="1"
                            max="1440"
                            value={config.timeWindowMinutes}
                            onChange={(e) => updateRuleConfig('RAPID_UPDATES', { timeWindowMinutes: parseInt(e.target.value) || 1 })}
                            disabled={saving || !rule.is_active}
                        />
                        <span className="hint-message">Time period to count updates (1-1440 mins)</span>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Default Severity</label>
                        <select
                            value={rule.default_severity}
                            onChange={(e) => updateRuleSeverity('RAPID_UPDATES', e.target.value)}
                            disabled={saving || !rule.is_active}
                        >
                            {SEVERITY_OPTIONS.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        );
    };

    const tabs = [
        { code: 'VOLUME_SPIKE', label: 'Volume Spike', icon: 'ri-bar-chart-line' },
        { code: 'OFF_HOURS', label: 'Off Hours', icon: 'ri-time-line' },
        { code: 'MASS_DELETE', label: 'Mass Delete', icon: 'ri-delete-bin-line' },
        { code: 'RAPID_UPDATES', label: 'Rapid Updates', icon: 'ri-refresh-line' }
    ];

    return (
        <>
            <div className="modal-heading">
                <h2 className="modal-title">Configure Anomaly Detection Rules</h2>
                <button className="close-modal-btn" onClick={onClose} disabled={saving}>
                    <i className="ri-close-line"></i>
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
                    <p>Loading rules...</p>
                </div>
            ) : (
                <>
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '20px',
                        flexWrap: 'wrap',
                        borderBottom: '1px solid var(--border-color)',
                        paddingBottom: '15px'
                    }}>
                        {tabs.map(tab => {
                            const rule = getRule(tab.code);
                            return (
                                <button
                                    key={tab.code}
                                    onClick={() => setActiveTab(tab.code)}
                                    style={{
                                        padding: '10px 16px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        backgroundColor: activeTab === tab.code
                                            ? 'var(--primary-color)'
                                            : 'var(--foreground-color)',
                                        color: activeTab === tab.code ? 'white' : 'var(--primary-text-color)',
                                        fontWeight: 600,
                                        fontSize: '13px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s ease',
                                        opacity: rule?.is_active ? 1 : 0.6
                                    }}
                                >
                                    <i className={tab.icon}></i>
                                    {tab.label}
                                    {!rule?.is_active && (
                                        <span style={{
                                            fontSize: '10px',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            backgroundColor: 'var(--error-chip-bg-color)',
                                            color: 'var(--error-chip-text-color)'
                                        }}>OFF</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="modal-content add" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {activeTab === 'VOLUME_SPIKE' && renderVolumeSpike()}
                        {activeTab === 'OFF_HOURS' && renderOffHours()}
                        {activeTab === 'MASS_DELETE' && renderMassDelete()}
                        {activeTab === 'RAPID_UPDATES' && renderRapidUpdates()}
                    </div>
                </>
            )}

            <div className="modal-actions">
                <button className="cancel-btn" onClick={onClose} disabled={saving}>Cancel</button>
                <button
                    className="submit-btn"
                    onClick={handleSave}
                    disabled={saving || loading}
                    style={{ opacity: saving ? 0.7 : 1, cursor: saving ? 'wait' : 'pointer' }}
                >
                    {saving
                        ? <><i className="fa-solid fa-spinner fa-spin"></i> Saving...</>
                        : 'Save Changes'}
                </button>
            </div>

            <style jsx>{`
                .rule-config-section {
                    padding: 15px;
                    background: var(--table-row-hover-color);
                    border-radius: 10px;
                }
                .rule-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 20px;
                    gap: 15px;
                }
                .rule-info h3 {
                    margin: 0 0 5px 0;
                    font-size: 16px;
                    color: var(--primary-text-color);
                }
                .rule-description {
                    margin: 0;
                    font-size: 13px;
                    color: var(--secondary-text-color);
                    line-height: 1.5;
                }
            `}</style>
        </>
    );
};

export default AnomalyRulesModal;
