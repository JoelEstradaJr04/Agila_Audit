import React, { useState } from 'react';
import '../styles/components/forms.css';
import { showEmptyFieldWarning, showError } from '../utils/Alerts';

export interface RecipientData {
    email: string;
    name: string;
    role: string;
    department: string;
    notify_low: boolean;
    notify_medium: boolean;
    notify_high: boolean;
    notify_critical: boolean;
}

interface Props {
    onClose: () => void;
    onSave: (data: RecipientData) => Promise<void> | void;
    initialData?: RecipientData;
}

const AddRecipientModal: React.FC<Props> = ({ onClose, onSave, initialData }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<RecipientData>(
        initialData || {
        email: '',
        name: '',
        role: '',
        department: '',
        notify_low: false,
        notify_medium: true,
        notify_high: true,
        notify_critical: true
    });

    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async () => {
        if (!formData.email || !formData.name) {
            showEmptyFieldWarning();
            return;
        }

        if (!isValidEmail(formData.email)) {
            showError('Please enter a valid email address.', 'Invalid');
            return;
        }

        if (
            !formData.notify_low &&
            !formData.notify_medium &&
            !formData.notify_high &&
            !formData.notify_critical
        ) {
            showError('Select at least one severity level.', 'Missing Severity');
            return;
        }

        setIsLoading(true);
        try {
            await onSave(formData);
            // Modal might close here if parent succeeds, so no state update after
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="modal-heading">
                <h2 className="modal-title">{initialData ? 'Edit Recipient' : 'Add Recipient'}</h2>
                <button className="close-modal-btn" onClick={onClose} disabled={isLoading}>
                    <i className="ri-close-line"></i>
                </button>
            </div>

            <p className="details-title">I. Recipient Information</p>
            <div className="modal-content add">
                <div className="form-row">
                    <div className="form-group">
                        <label>Full Name <span className="requiredTags">*</span></label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. John Doe"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email Address <span className="requiredTags">*</span></label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="e.g. john@example.com"
                            disabled={isLoading}
                        />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Role</label>
                        <input
                            type="text"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            placeholder="e.g. System Admin"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label>Department</label>
                        <input
                            type="text"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            placeholder="e.g. IT Security"
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </div>

            <p className="details-title">II. Notification Preferences</p>
            <div className="modal-content add">
                <label style={{ fontSize: '14px', color: 'var(--secondary-text-color)', marginBottom: '10px', display: 'block' }}>
                    Select which severity levels trigger an email alert:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="checkbox-wrapper" style={{ background: 'var(--foreground-color)' }}>
                        <input
                            type="checkbox"
                            checked={formData.notify_critical}
                            onChange={(e) => setFormData({ ...formData, notify_critical: e.target.checked })}
                            disabled={isLoading}
                        />
                        <label>Critical Severity</label>
                    </div>
                    <div className="checkbox-wrapper" style={{ background: 'var(--foreground-color)' }}>
                        <input
                            type="checkbox"
                            checked={formData.notify_high}
                            onChange={(e) => setFormData({ ...formData, notify_high: e.target.checked })}
                            disabled={isLoading}
                        />
                        <label>High Severity</label>
                    </div>
                    <div className="checkbox-wrapper" style={{ background: 'var(--foreground-color)' }}>
                        <input
                            type="checkbox"
                            checked={formData.notify_medium}
                            onChange={(e) => setFormData({ ...formData, notify_medium: e.target.checked })}
                            disabled={isLoading}
                        />
                        <label>Medium Severity</label>
                    </div>
                    <div className="checkbox-wrapper" style={{ background: 'var(--foreground-color)' }}>
                        <input
                            type="checkbox"
                            checked={formData.notify_low}
                            onChange={(e) => setFormData({ ...formData, notify_low: e.target.checked })}
                            disabled={isLoading}
                        />
                        <label>Low Severity</label>
                    </div>
                </div>
            </div>

            <div className="modal-actions">
                <button className="cancel-btn" onClick={onClose} disabled={isLoading}>Cancel</button>
                <button
                    className="submit-btn"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'wait' : 'pointer' }}
                >
                    {isLoading 
                    ? <><i className="fa-solid fa-spinner fa-spin"></i> Saving...</> 
                    : (initialData ? 'Save Changes' : 'Save Recipient')}
                </button>
            </div>
        </>
    );
};

export default AddRecipientModal;
