import { useState, useEffect, useRef } from 'react';
import './App.css';
import ServiceDetail from './pages/ServiceDetail';
import Login from './pages/Login';
import RegisterAccount from './pages/RegisterAccount';
import RegisterOrganization from './pages/RegisterOrganization';
import Welcome from './pages/Welcome';

const BASE = `http://${process.env.REACT_APP_API_HOST}/API-Management-Server`;

function ConnectGithubTab({ onClick, connected }) {
  return (
    <button
      className="account-tab github-tab"
      onClick={connected ? undefined : onClick}
      style={connected ? { cursor: 'default' } : undefined}
    >
      <span className="account-tab-avatar github-tab-avatar">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
        </svg>
      </span>
      <span className="account-tab-info">
        <span className="account-tab-name">Connect GitHub</span>
        <span className={`github-status-badge${connected ? ' github-status-badge--on' : ' github-status-badge--off'}`}>
          <span className="github-status-dot" />
          {connected ? 'Connected' : 'Not connected'}
        </span>
      </span>
      {!connected && <span className="account-tab-chevron">›</span>}
    </button>
  );
}

function AccountTab({ onClick }) {
  return (
    <button className="account-tab" onClick={onClick}>
      <span className="account-tab-avatar">A</span>
      <span className="account-tab-info">
        <span className="account-tab-name">My Account</span>
        <span className="account-tab-sub">Manage profile</span>
      </span>
      <span className="account-tab-chevron">›</span>
    </button>
  );
}

function ServicesSidebar({ accountId, selectedService, onSelectService, githubToken, onConnectGithub, onLogout }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [repos, setRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState(null);

  useEffect(() => {
    fetch(`${BASE}/accounts/${accountId}/services`)
      .then(r => r.json())
      .then(data => { setServices(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [accountId]);

  useEffect(() => {
    if (!githubToken) { setRepos([]); return; }
    setReposLoading(true);
    setReposError(null);
    fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
      headers: { Authorization: `Bearer ${githubToken}` },
    })
      .then(r => r.json())
      .then(async data => {
        const checks = await Promise.all(
          data.map(r =>
            fetch(`https://api.github.com/repos/${r.full_name}/contents/api-dep-folder`, {
              headers: { Authorization: `Bearer ${githubToken}` },
            })
              .then(async res => {
                if (!res.ok) return { repo: r, hasFolder: false };
                const body = await res.json();
                return { repo: r, hasFolder: Array.isArray(body) };
              })
              .catch(() => ({ repo: r, hasFolder: false }))
          )
        );
        setRepos(
          checks
            .filter(({ hasFolder }) => hasFolder)
            .map(({ repo: r }) => ({ id: `gh-${r.id}`, serviceName: r.name, fullName: r.full_name }))
        );
        setReposLoading(false);
      })
      .catch(err => { setReposError(err.message); setReposLoading(false); });
  }, [githubToken]);

  function handleAccountClick() {
    // TODO: define account tab behaviour
  }

  return (
    <nav className="sidebar-services">
      <div className="sidebar-services-scroll">
        <h2>My Services</h2>
        {loading && <p className="sidebar-msg">Loading...</p>}
        {error && <p className="sidebar-msg sidebar-msg-error">{error}</p>}
        {!loading && !error && services.length === 0 && repos.length === 0 && (
          <p className="sidebar-msg">No services.</p>
        )}
        {[...services, ...repos].map(s => (
          <button
            key={s.id}
            className={selectedService?.id === s.id ? 'active' : ''}
            onClick={() => onSelectService(s)}
          >
            {s.serviceName}
          </button>
        ))}
        {reposLoading && <p className="sidebar-msg">Loading...</p>}
        {reposError && <p className="sidebar-msg sidebar-msg-error">{reposError}</p>}
      </div>
      <div className="sidebar-bottom">
        <ConnectGithubTab onClick={onConnectGithub} connected={!!githubToken} />
        <AccountTab onClick={handleAccountClick} />
        <button className="logout-btn" onClick={onLogout}>
          <span className="logout-btn-icon">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          Log out
        </button>
      </div>
    </nav>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">⚡</div>
      <h2>Select a service</h2>
      <p>Choose a service from the sidebar to view its details.</p>
    </div>
  );
}

function saveSession(accountId) {
  localStorage.setItem('accountId', String(accountId));
}

function loadSession() {
  return localStorage.getItem('accountId');
}

function clearSession() {
  localStorage.removeItem('accountId');
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!loadSession());
  const [authPage, setAuthPage] = useState('welcome');
  const [accountId, setAccountId] = useState(() => loadSession());
  const [selectedService, setSelectedService] = useState(null);
  const [githubToken, setGithubToken] = useState(
    () => localStorage.getItem('githubAccessToken') ?? null
  );

  const oauthHandled = useRef(false);

  // Handle GitHub OAuth redirect-back: exchange the code for an access token.
  useEffect(() => {
    // Guard against React 18 Strict Mode running effects twice in development
    if (oauthHandled.current) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state) return;

    oauthHandled.current = true;

    const savedState = localStorage.getItem('githubOAuthState');
    localStorage.removeItem('githubOAuthState');

    if (state !== savedState) {
      console.error('GitHub OAuth: state mismatch — possible CSRF attack');
      return;
    }

    fetch(`${BASE}/auth/github/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(r => r.json())
      .then(data => {
        // Accept both camelCase (Java/Spring default) and snake_case
        const token = data.accessToken ?? data.access_token;
        if (!token) {
          console.error('GitHub token exchange: unexpected response', data);
          return;
        }
        localStorage.setItem('githubAccessToken', token);
        setGithubToken(token);
        window.history.replaceState({}, '', window.location.pathname);
      })
      .catch(err => console.error('GitHub token exchange failed:', err));
  }, []);

  function handleConnectGithub() {
    const state = crypto.randomUUID();
    localStorage.setItem('githubOAuthState', state);

    const params = new URLSearchParams({
      client_id: process.env.REACT_APP_GITHUB_CLIENT_ID,
      scope: 'repo',
      state,
    });

    window.location.assign(`https://github.com/login/oauth/authorize?${params}`);
  }

  function handleLogin(account) {
    saveSession(account.id);
    setIsLoggedIn(true);
    setAccountId(account.id);
  }

  function handleLogout() {
    clearSession();
    localStorage.removeItem('githubAccessToken');
    localStorage.removeItem('githubOAuthState');
    setIsLoggedIn(false);
    setAccountId(null);
    setGithubToken(null);
    setSelectedService(null);
    setAuthPage('welcome');
  }

  if (!isLoggedIn) {
    if (authPage === 'welcome')          return <Welcome onNavigate={setAuthPage} />;
    if (authPage === 'register-org')     return <RegisterOrganization onNavigate={setAuthPage} />;
    if (authPage === 'register-account') return <RegisterAccount onNavigate={setAuthPage} />;
    return (
      <Login
        onLogin={handleLogin}
        onNavigate={setAuthPage}
      />
    );
  }

  return (
    <div className="layout">
      <ServicesSidebar
        accountId={accountId}
        selectedService={selectedService}
        onSelectService={setSelectedService}
        githubToken={githubToken}
        onConnectGithub={handleConnectGithub}
        onLogout={handleLogout}
      />
      <main className="content">
        {selectedService ? <ServiceDetail service={selectedService} githubToken={githubToken} /> : <EmptyState />}
      </main>
    </div>
  );
}
