// Central place for every call to the backend (Sprint 1 API).
// Change this if your backend runs on a different port.
const API_BASE = 'http://localhost:3000';

function getToken() {
    return localStorage.getItem('securetrack_token');
}

function setToken(token) {
    localStorage.setItem('securetrack_token', token);
}

function clearToken() {
    localStorage.removeItem('securetrack_token');
}

async function request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        // Surface the backend's error message so the form can show it (this is what TC-02/TC-08 rely on)
        throw new Error(data.error || `Request failed with status ${res.status}`);
    }
    return data;
}

export const api = {
    // FR: signup / login (NFR-01, NFR-02)
    signup: (payload) => request('/api/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
    login: async (payload) => {
        const data = await request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
        setToken(data.token);
        return data;
    },
    logout: clearToken,
    isLoggedIn: () => !!getToken(),

    // FR-01/FR-02: submit an incident
    createIncident: (payload) => request('/api/incidents', { method: 'POST', body: JSON.stringify(payload) }),

    // FR-05: view a single incident
    getIncident: (id) => request(`/api/incidents/${id}`),

    // FR-05/FR-06: update status (admin/manager only — expect 403 for employee, this is TC-08 evidence)
    updateStatus: (id, status) =>
        request(`/api/incidents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

    // FR-07: list/report (admin/manager only)
    listIncidents: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/incidents${qs ? `?${qs}` : ''}`);
    },
};
