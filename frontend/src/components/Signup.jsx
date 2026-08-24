import React, { useState } from 'react';
import { api } from '../api/client';

export default function Signup({ onSignedUp, onGoToLogin }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'employee' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.signup(form); // creates the row; password is bcrypt-hashed server-side (NFR-01)
      setSuccess('Account created. You can log in now.');
      setTimeout(onSignedUp, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>Create account</h1>
      <p className="subtitle">SecureTrack incident reporting</p>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <label htmlFor="full_name">Full name</label>
        <input id="full_name" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} required />

        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={8} />

        <label htmlFor="role">Role</label>
        <select id="role" value={form.role} onChange={(e) => update('role', e.target.value)}>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
        </select>

        <button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
      </form>

      <div className="link-row">
        Already have an account? <a onClick={onGoToLogin}>Log in</a>
      </div>
    </div>
  );
}
