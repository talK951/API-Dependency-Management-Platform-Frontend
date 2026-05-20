import { useState } from 'react';

const BASE = `http://${process.env.REACT_APP_API_HOST}/API-Management-Server`;

function ResponseBox({ text, isError }) {
  if (!text) return null;
  return <div className={`response${isError ? ' error' : ''}`}>{text}</div>;
}

export default function Login({ onLogin, onNavigate }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [res, setRes] = useState(null);
  const [isError, setIsError] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const r = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, password: form.password }),
      });
      if (r.ok) {
        const data = await r.json();
        onLogin(data);
      } else {
        const text = await r.text();
        setRes(text || 'Login failed.');
        setIsError(true);
      }
    } catch (err) {
      setRes(err.message);
      setIsError(true);
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h2>API Manager — Sign In</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="e.g. john_doe"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>
          <button className="btn btn-primary" type="submit">Login</button>
        </form>
        <ResponseBox text={res} isError={isError} />
        <div className="auth-link">
          Don't have an account?{' '}
          <button type="button" onClick={() => onNavigate('register-account')}>Register</button>
        </div>
        <div className="auth-link">
          <button type="button" onClick={() => onNavigate('welcome')}>← Back</button>
        </div>
      </div>
    </div>
  );
}
