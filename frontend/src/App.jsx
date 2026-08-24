import React, { useState } from 'react';
import { api } from './api/client';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import ReportIncident from './components/ReportIncident.jsx';
import IncidentDetail from './components/IncidentDetail.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';

// Simple view switcher — no router library needed for this scope.
export default function App() {
  const isAdmin = api.getRole() === 'admin' || api.getRole() === 'manager';
  const [view, setView] = useState(
    api.isLoggedIn() ? (isAdmin ? 'dashboard' : 'report') : 'login'
  );
  const [lastIncidentId, setLastIncidentId] = useState(null);

  function handleLoggedIn() {
    const admin = api.getRole() === 'admin' || api.getRole() === 'manager';
    setView(admin ? 'dashboard' : 'report');
  }

  function handleIncidentCreated(id) {
    setLastIncidentId(id);
    setView('detail');
  }

  function handleLogout() {
    api.logout();
    setView('login');
  }

  return (
    <div>
      {api.isLoggedIn() && (
        <div style={{ textAlign: 'right', padding: '12px 24px', display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
          {isAdmin && (
            <>
              <a onClick={() => setView('dashboard')} style={{ cursor: 'pointer', fontSize: 13, color: '#1a56db' }}>
                Dashboard
              </a>
              <a onClick={() => setView('report')} style={{ cursor: 'pointer', fontSize: 13, color: '#1a56db' }}>
                Report incident
              </a>
            </>
          )}
          <a onClick={handleLogout} style={{ cursor: 'pointer', fontSize: 13, color: '#1a56db' }}>
            Log out
          </a>
        </div>
      )}

      {view === 'login' && (
        <Login onLoggedIn={handleLoggedIn} onGoToSignup={() => setView('signup')} />
      )}
      {view === 'signup' && (
        <Signup onSignedUp={() => setView('login')} onGoToLogin={() => setView('login')} />
      )}
      {view === 'report' && (
        <ReportIncident onCreated={handleIncidentCreated} />
      )}
      {view === 'detail' && (
        <IncidentDetail incidentId={lastIncidentId} onBack={() => setView('report')} />
      )}
      {view === 'dashboard' && <AdminDashboard />}
    </div>
  );
}
