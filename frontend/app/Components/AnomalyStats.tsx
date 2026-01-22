import React from 'react';
import { AnomalyStats as StatsType } from '../types/anomaly';
import '../styles/anomaly.css';

interface Props {
    stats: StatsType;
}

const AnomalyStats: React.FC<Props> = ({ stats }) => {
    return (
        <div className="stats-grid">
            <div className="stat-card">
                <h3>Total Alerts</h3>
                <div className="value">{stats.total}</div>
            </div>

            <div className="stat-card critical">
                <h3>Unresolved</h3>
                <div className="value">{stats.unresolved}</div>
            </div>

            <div className="stat-card medium">
                <h3>Recent (24h)</h3>
                <div className="value">{stats.recent24h}</div>
            </div>

            <div className="stat-card low">
                <h3>Resolved</h3>
                <div className="value">{stats.resolved}</div>
            </div>
        </div>
    );
};

export default AnomalyStats;
