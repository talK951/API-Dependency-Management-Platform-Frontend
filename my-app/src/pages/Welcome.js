export default function Welcome({ onNavigate }) {
  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h2>Welcome to API Manager</h2>
        <p className="auth-subtitle">Manage your organization's APIs and services.</p>
        <div className="welcome-actions">
          <button className="btn btn-primary" onClick={() => onNavigate('login')}>
            Login
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('register-org')}>
            Sign Up Organization
          </button>
        </div>
      </div>
    </div>
  );
}
