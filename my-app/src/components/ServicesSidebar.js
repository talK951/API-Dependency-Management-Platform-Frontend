import { useState, useEffect } from 'react';
import ConnectGithubTab from './ConnectGithubTab';
import AccountTab from './AccountTab';
import { BASE } from '../utils/api';

export default function ServicesSidebar({ accountId, selectedService, onSelectService, githubToken, onConnectGithub, onLogout }) {
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
