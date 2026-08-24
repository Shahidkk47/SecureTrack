import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function IncidentDetail({ incidentId, onBack }) {
  const [incident, setIncident] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getIncident(incidentId); // FR-05: view current status
        setIncident(data);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [incidentId]);

  return (
    <div className="container">
      <h1>Incident submitted</h1>
      <p className="subtitle">This is your confirmation — save the ID for follow-up.</p>

      {error && <div className="error">{error}</div>}

      {incident && (
        <div className="incident-card">
          <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>ID: {incident.id}</div>
          <div style={{ marginBottom: 8 }}>{incident.description}</div>
          <span className={`badge ${incident.severity}`}>{incident.severity}</span>{' '}
          <span style={{ fontSize: 13, color: '#555' }}>Status: {incident.status}</span>
        </div>
      )}

      <button onClick={onBack} style={{ marginTop: 16 }}>Report another incident</button>
    </div>
  );
}
