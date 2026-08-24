import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['New', 'In Progress', 'Resolved', 'Closed'];

// Admin/manager view: list all incidents, change severity, assign staff, update status.
// Covers FR-03 (severity), FR-04 (assignment), FR-05 (status), FR-07 (report/list).
export default function AdminDashboard() {
    const [incidents, setIncidents] = useState([]);
    const [staff, setStaff] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingId, setSavingId] = useState(null);

    async function loadIncidents() {
        setLoading(true);
        setError('');
        try {
            const params = statusFilter ? { status: statusFilter } : {};
            const data = await api.listIncidents(params);
            setIncidents(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadIncidents();
        api.listUsers().then(setStaff).catch(() => setStaff([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

    async function handleSeverityChange(id, severity) {
        setSavingId(id);
        try {
            const updated = await api.updateSeverity(id, severity);
            setIncidents((prev) => prev.map((inc) => (inc.id === id ? updated : inc)));
        } catch (err) {
            setError(err.message);
        } finally {
            setSavingId(null);
        }
    }

    async function handleStatusChange(id, status) {
        setSavingId(id);
        try {
            const updated = await api.updateStatus(id, status);
            setIncidents((prev) => prev.map((inc) => (inc.id === id ? updated : inc)));
        } catch (err) {
            setError(err.message);
        } finally {
            setSavingId(null);
        }
    }

    async function handleAssign(id, userId) {
        if (!userId) return;
        setSavingId(id);
        try {
            const updated = await api.assignIncident(id, userId);
            setIncidents((prev) => prev.map((inc) => (inc.id === id ? updated : inc)));
        } catch (err) {
            setError(err.message);
        } finally {
            setSavingId(null);
        }
    }

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
            <h2 style={{ marginBottom: 4 }}>Admin dashboard</h2>
            <p style={{ color: '#555', marginTop: 0 }}>
                FR-03/04/05/07: classify, assign, track status, and review all incidents.
            </p>

            <div style={{ marginBottom: 16 }}>
                <label style={{ marginRight: 8 }}>Filter by status:</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All</option>
                    {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            {error && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 6, marginBottom: 12 }}>
                    {error}
                </div>
            )}

            {loading ? (
                <p>Loading incidents…</p>
            ) : incidents.length === 0 ? (
                <p>No incidents found.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
                            <th style={{ padding: 8 }}>Description</th>
                            <th style={{ padding: 8 }}>Severity</th>
                            <th style={{ padding: 8 }}>Status</th>
                            <th style={{ padding: 8 }}>Assigned to</th>
                            <th style={{ padding: 8 }}>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {incidents.map((inc) => (
                            <tr key={inc.id} style={{ borderBottom: '1px solid #f0f0f0', opacity: savingId === inc.id ? 0.5 : 1 }}>
                                <td style={{ padding: 8, maxWidth: 260 }}>{inc.description}</td>
                                <td style={{ padding: 8 }}>
                                    <select
                                        value={inc.severity}
                                        onChange={(e) => handleSeverityChange(inc.id, e.target.value)}
                                        disabled={savingId === inc.id}
                                    >
                                        {SEVERITIES.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </td>
                                <td style={{ padding: 8 }}>
                                    <select
                                        value={inc.status}
                                        onChange={(e) => handleStatusChange(inc.id, e.target.value)}
                                        disabled={savingId === inc.id}
                                    >
                                        {STATUSES.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </td>
                                <td style={{ padding: 8 }}>
                                    <select
                                        value={inc.assigned_user_id || ''}
                                        onChange={(e) => handleAssign(inc.id, e.target.value)}
                                        disabled={savingId === inc.id}
                                    >
                                        <option value="">Unassigned</option>
                                        {staff.map((u) => (
                                            <option key={u.id} value={u.id}>{u.full_name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td style={{ padding: 8, fontSize: 13, color: '#666' }}>
                                    {new Date(inc.created_at).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
