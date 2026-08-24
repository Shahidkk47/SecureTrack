import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function ReportIncident({ onCreated }) {
  const [categories, setCategories] = useState([]);
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.listIncidents; // no-op reference to keep eslint quiet if unused elsewhere
    (async () => {
      try {
        const res = await fetch('http://localhost:3000/api/categories', {
          headers: { Authorization: `Bearer ${localStorage.getItem('securetrack_token')}` },
        });
        const data = await res.json();
        setCategories(data);
        if (data.length) setCategoryId(data[0].id);
      } catch {
        setError('Could not load categories — is the backend running?');
      }
    })();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Mirrors the backend validation (TC-02: description too short -> 400)
    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters.');
      return;
    }

    setLoading(true);
    try {
      const incident = await api.createIncident({ description, category_id: categoryId });
      onCreated(incident.id); // TC-01/TC-03: new incident gets a unique ID, status defaults to "New"
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>Report an incident</h1>
      <p className="subtitle">FR-01: describe what happened, we'll route it to the right team.</p>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label htmlFor="category">Category</label>
        <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <label htmlFor="description">What happened?</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Received a suspicious email asking to reset my password…"
          required
        />

        <button type="submit" disabled={loading || !categoryId}>
          {loading ? 'Submitting…' : 'Submit report'}
        </button>
      </form>
    </div>
  );
}
