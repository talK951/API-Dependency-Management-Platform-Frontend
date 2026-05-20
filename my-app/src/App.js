import { useState, useEffect } from 'react';
import './App.css';
import ServiceDetail from './pages/ServiceDetail';
import Login from './pages/Login';
import RegisterAccount from './pages/RegisterAccount';
import RegisterOrganization from './pages/RegisterOrganization';
import Welcome from './pages/Welcome';

const BASE = `http://${process.env.REACT_APP_API_HOST}/API-Management-Server`;

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

function ServicesSidebar({ accountId, selectedService, onSelectService }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${BASE}/accounts/${accountId}/services`)
      .then(r => r.json())
      .then(data => { setServices(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [accountId]);

  function handleAccountClick() {
    // TODO: define account tab behaviour
  }

  return (
    <nav className="sidebar-services">
      <div className="sidebar-services-scroll">
        <h2>My Services</h2>
        {loading && <p className="sidebar-msg">Loading...</p>}
        {error && <p className="sidebar-msg sidebar-msg-error">{error}</p>}
        {!loading && !error && services.length === 0 && (
          <p className="sidebar-msg">No services.</p>
        )}
        {services.map(s => (
          <button
            key={s.id}
            className={selectedService?.id === s.id ? 'active' : ''}
            onClick={() => onSelectService(s)}
          >
            {s.serviceName}
          </button>
        ))}
      </div>
      <AccountTab onClick={handleAccountClick} />
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

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authPage, setAuthPage] = useState('welcome');
  const [accountId, setAccountId] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  if (!isLoggedIn) {
    if (authPage === 'welcome')          return <Welcome onNavigate={setAuthPage} />;
    if (authPage === 'register-org')     return <RegisterOrganization onNavigate={setAuthPage} />;
    if (authPage === 'register-account') return <RegisterAccount onNavigate={setAuthPage} />;
    return (
      <Login
        onLogin={account => { setIsLoggedIn(true); setAccountId(account.id); }}
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
      />
      <main className="content">
        {selectedService ? <ServiceDetail service={selectedService} /> : <EmptyState />}
      </main>
    </div>
  );
}
