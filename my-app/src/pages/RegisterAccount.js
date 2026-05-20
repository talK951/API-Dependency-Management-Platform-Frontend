import { useState, useEffect } from 'react';

const BASE = `http://${process.env.REACT_APP_API_HOST}/API-Management-Server`;

function ResponseBox({ text, isError }) {
  if (!text) return null;
  return <div className={`response${isError ? ' error' : ''}`}>{text}</div>;
}

const EMPTY = { orgId: '', name: '', username: '', hashedPass: '', email: '' };

export default function RegisterAccount({ onNavigate }) {
  const [orgs, setOrgs] = useState([]);
  const [orgsErr, setOrgsErr] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [res, setRes] = useState(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/organizations`)
      .then(r => r.json())
      .then(data => setOrgs(data))
      .catch(err => setOrgsErr(err.message));
  }, []);

  async function handleRegister(e) {
    e.preventDefault();
    try {
      const r = await fetch(`${BASE}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          hashedPass: form.hashedPass,
          email: form.email,
          organization: { id: parseInt(form.orgId) },
        }),
      });
      const text = await r.text();
      if (r.ok) {
        onNavigate('login');
      } else {
        setRes(text || 'Registration failed.');
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
        <h2>Register Account</h2>
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Organization</label>
            {orgsErr ? (
              <div className="response error">{orgsErr}</div>
            ) : (
              <select
                value={form.orgId}
                onChange={e => setForm({ ...form, orgId: e.target.value })}
                required
              >
                <option value="">— Select organization —</option>
                {orgs.map(org => (
                  <option key={org.id} value={org.id}>{org.orgName}</option>
                ))}
              </select>
            )}
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. John Doe"
              required
            />
          </div>
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
              value={form.hashedPass}
              onChange={e => setForm({ ...form, hashedPass: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="e.g. john@example.com"
              required
            />
          </div>
          <button className="btn btn-primary" type="submit">Register</button>
        </form>
        <ResponseBox text={res} isError={isError} />
        <div className="auth-link">
          Already have an account?{' '}
          <button type="button" onClick={() => onNavigate('login')}>Sign in</button>
        </div>
      </div>
    </div>
  );
}
