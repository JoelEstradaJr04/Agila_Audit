'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModalManager from '../../../Components/modalManager';
import AddRecipientModal, { RecipientData } from '../../../Components/AddRecipientModal';
import AnomalyRulesModal from '../../../Components/AnomalyRulesModal';

import { BackButton } from '../../../Components/backButton';
import Loading from '../../../Components/loading';
import '../../../styles/components/table.css';
import '../../../globals.css';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

interface Recipient {
    id: number;
    email: string;
    name: string;
    role: string | null;
    department: string | null;
    notify_low: boolean;
    notify_medium: boolean;
    notify_high: boolean;
    notify_critical: boolean;
    is_active: boolean;
}

export default function NotificationSettingsPage() {
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<React.ReactNode>(null);

    const fetchRecipients = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/notification-recipients`);
            if (res.data.success) {
                setRecipients(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch recipients', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipients();
    }, []);

    const handleCreateRecipient = async (data: RecipientData) => {
        try {
            await axios.post(`${API_URL}/api/notification-recipients`, data);
            setIsModalOpen(false);
            fetchRecipients();
            // alert('Recipient added successfully');
        } catch (error: any) {
            console.error('Failed to add recipient', error);
            alert(error.response?.data?.error || 'Failed to add recipient');
            throw error; // Rethrow so the modal knows it failed
        }
    };

    const openAddModal = () => {
        setModalContent(
            <AddRecipientModal
                onClose={() => setIsModalOpen(false)}
                onSave={handleCreateRecipient}
            />
        );
        setIsModalOpen(true);
    };

    const openRulesModal = () => {
        setModalContent(
            <AnomalyRulesModal
                onClose={() => setIsModalOpen(false)}
            />
        );
        setIsModalOpen(true);
    };



    const handleToggleStatus = async (id: number) => {
        try {
            await axios.patch(`${API_URL}/api/notification-recipients/${id}/toggle`);
            setRecipients(recipients.map(r =>
                r.id === id ? { ...r, is_active: !r.is_active } : r
            ));
        } catch (error) {
            console.error('Failed to toggle status', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await axios.delete(`${API_URL}/api/notification-recipients/${id}`);
            setRecipients(recipients.filter(r => r.id !== id));
        } catch (error) {
            console.error('Failed to delete recipient', error);
        }
    };

    const handleEditRecipient = (recipient: Recipient) => {
        setModalContent(
            <AddRecipientModal
                onClose={() => setIsModalOpen(false)}
                onSave={(data) => handleUpdateRecipient(recipient.id, data)}
                initialData={{
                    email: recipient.email,
                    name: recipient.name,
                    role: recipient.role || '',
                    department: recipient.department || '',
                    notify_low: recipient.notify_low,
                    notify_medium: recipient.notify_medium,
                    notify_high: recipient.notify_high,
                    notify_critical: recipient.notify_critical,
                }}
            />
        );
        setIsModalOpen(true);
    };

    const handleUpdateRecipient = async (id: number, data: RecipientData) => {
        try {
            await axios.put(`${API_URL}/api/notification-recipients/${id}`, data);
            setIsModalOpen(false);
            fetchRecipients();
        } catch (error: any) {
            console.error('Failed to update recipient', error);
            alert(error.response?.data?.error || 'Failed to update recipient');
            throw error;
        }
    };

    if (loading) {
        return (
            <>
                <div style={{ display: 'flex', flex: 1, width: '100%', paddingLeft: 30, paddingTop: 10, paddingBottom: 10 }}>
                    <div style={{ display: 'flex', top: '1rem', left: '1rem', zIndex: 10 }}>
                        <BackButton variant="default" size="default" href={process.env.NEXT_PUBLIC_MAIN_FRONTEND || '/anomalies'} aria-label="Go back" />
                    </div>
                </div>
                <div className="card">
                    <h1 className="title">Notification Settings</h1>
                    <Loading />
                </div>
            </>
        );
    }

    return (
        <>
            <div style={{ paddingLeft: '30px', paddingTop: '10px', paddingBottom: '10px', width: '100%' }}>
                <div style={{ display: 'flex', top: '1rem', left: '1rem', zIndex: 10, marginBottom: '10px' }}>
                    <BackButton variant="default" size="default" href="/anomalies" aria-label="Go back" />
                </div>
            </div>

            <div className="card">
                <div className="elements">
                    <h1 className="title" style={{ fontSize: '24px', fontWeight: 600, marginBottom: '15px' }}>Notification Settings</h1>

                    <div className="settings">
                        <div className="search-filter-container">
                            <p style={{ color: 'var(--secondary-text-color)' }}>Manage who receives email alerts for anomalies.</p>
                        </div>
                        <div className="filters" style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={openRulesModal}
                                style={{
                                    height: '35px', padding: '0 15px', borderRadius: '8px',
                                    backgroundColor: 'var(--secondary-color)', color: 'white', border: 'none',
                                    fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                                }}
                            >
                                <i className="ri-settings-3-line"></i> Configure Rules
                            </button>
                            <button
                                onClick={openAddModal}
                                style={{
                                    height: '35px', padding: '0 15px', borderRadius: '8px',
                                    backgroundColor: 'var(--primary-color)', color: 'white', border: 'none',
                                    fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                                }}
                            >
                                <i className="fa-solid fa-plus"></i> Add Recipient
                            </button>
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <div className="tableContainer">
                            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th>Name / Role</th>
                                        <th>Email / Dept</th>
                                        <th>Subscribed Alerts</th>
                                        <th style={{ textAlign: 'center' }}>Status</th>
                                        <th style={{ textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recipients.length === 0 ? (
                                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px' }} className="noRecords">No recipients found.</td></tr>
                                    ) : (
                                        recipients.map((r) => (
                                            <tr key={r.id} style={{ opacity: r.is_active ? 1 : 0.6 }}>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--secondary-text-color)' }}>{r.role || '-'}</div>
                                                </td>
                                                <td>
                                                    <div>{r.email}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--secondary-text-color)' }}>{r.department || '-'}</div>
                                                </td>
                                                <td>
                                                    <div>
                                                        {r.notify_critical && <span className="new-item-badge" style={{ backgroundColor: 'var(--error-chip-bg-color)', color: 'var(--error-chip-text-color)' }}>CRIT</span>}
                                                        {r.notify_high && <span className="new-item-badge" style={{ backgroundColor: 'var(--warning-chip-bg-color)', color: 'var(--warning-chip-text-color)' }}>HIGH</span>}
                                                        {r.notify_medium && <span className="new-item-badge" style={{ backgroundColor: 'var(--info-chip-bg-color)', color: 'var(--info-chip-text-color)' }}>MED</span>}
                                                        {r.notify_low && <span className="new-item-badge" style={{ backgroundColor: 'var(--success-chip-bg-color)', color: 'var(--success-chip-text-color)' }}>LOW</span>}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                                                        backgroundColor: r.is_active ? 'var(--success-chip-bg-color)' : 'var(--error-chip-bg-color)',
                                                        color: r.is_active ? 'var(--success-chip-text-color)' : 'var(--error-chip-text-color)'
                                                    }}>
                                                        {r.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <div className="actionButtonsContainer">
                                                        <button
                                                            onClick={() => handleEditRecipient(r)}
                                                            className="editBtn"
                                                            title="Edit"
                                                        >
                                                            <i className="ri-edit-2-line" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleStatus(r.id)}
                                                            className={`${r.is_active ? 'approveBtn' : 'downBtn'}`}
                                                            title={r.is_active ? "Disable" : "Enable"}
                                                        >
                                                            <i className={`ri-arrow-${r.is_active ? 'up-fill' : 'down-fill'}`}></i>
                                                        </button>

                                                        <button
                                                            onClick={() => handleDelete(r.id)}
                                                            className="deleteBtn"
                                                            title="Delete"
                                                        >
                                                            <i className="ri-delete-bin-line"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
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
