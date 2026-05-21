import { useState, useEffect, useRef } from 'react';
import './App.css';
import ServiceDetail from './pages/ServiceDetail';
import Login from './pages/Login';
import RegisterAccount from './pages/RegisterAccount';
import RegisterOrganization from './pages/RegisterOrganization';
import Welcome from './pages/Welcome';
import ServicesSidebar from './components/ServicesSidebar';
import EmptyState from './components/EmptyState';
import { saveSession, loadSession, clearSession } from './utils/session';
import { BASE } from './utils/api';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!loadSession());
  const [authPage, setAuthPage] = useState('welcome');
  const [accountId, setAccountId] = useState(() => loadSession());
  const [selectedService, setSelectedService] = useState(null);
  const [githubToken, setGithubToken] = useState(
    () => localStorage.getItem('githubAccessToken') ?? null
  );

  const oauthHandled = useRef(false);

  useEffect(() => {
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
    return <Login onLogin={handleLogin} onNavigate={setAuthPage} />;
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
        {selectedService
          ? <ServiceDetail service={selectedService} githubToken={githubToken} />
          : <EmptyState />}
      </main>
    </div>
  );
}
