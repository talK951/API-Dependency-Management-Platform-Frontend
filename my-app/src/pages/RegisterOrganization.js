import { useState } from 'react';

const BASE = `http://${process.env.REACT_APP_API_HOST}/API-Management-Server`;

function ResponseBox({ text, isError }) {
  if (!text) return null;
  return <div className={`response${isError ? ' error' : ''}`}>{text}</div>;
}

export default function RegisterOrganization({ onNavigate }) {
  const [orgName, setOrgName] = useState('');
  const [res, setRes] = useState(null);
  const [isError, setIsError] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const r = await fetch(`${BASE}/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName }),
      });
      const text = await r.text();
      if (r.ok) {
        onNavigate('register-account');
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
        <h2>Register Organization</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Organization Name</label>
            <input
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="e.g. Acme Corp"
              required
            />
          </div>
          <button className="btn btn-primary" type="submit">Sign Up</button>
        </form>
        <ResponseBox text={res} isError={isError} />
        <div className="auth-link">
          <button type="button" onClick={() => onNavigate('welcome')}>← Back</button>
        </div>
      </div>
    </div>
  );
}
