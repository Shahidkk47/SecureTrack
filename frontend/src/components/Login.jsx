import React, { useState } from 'react';
import { api } from '../api/client';

export default function Login({ onLoggedIn, onGoToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.login({ email, password }); // TC: valid login -> token; invalid -> 401 shown below
      onLoggedIn();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>SecureTrack</h1>
      <p className="subtitle">Log in to report or manage incidents</p>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <button type="submit" disabled={loading}>{loading ? 'Logging in…' : 'Log in'}</button>
      </form>

      <div className="link-row">
        No account? <a onClick={onGoToSignup}>Sign up</a>
      </div>
    </div>
  );
}
