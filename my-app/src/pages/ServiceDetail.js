import { useState } from 'react';

const TABS = ['Releases', 'Adoption'];

function ReleasesSection() {
  return (
    <div className="tab-panel">
    </div>
  );
}

function AdoptionSection() {
  return (
    <div className="tab-panel">
    </div>
  );
}

export default function ServiceDetail({ service }) {
  const [activeTab, setActiveTab] = useState('Releases');

  return (
    <div className="service-detail">
      <h2 className="page-title">{service.serviceName}</h2>

      <div className="tab-bar">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`tab-btn${activeTab === tab ? ' tab-btn--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Releases' && <ReleasesSection />}
      {activeTab === 'Adoption' && <AdoptionSection />}
    </div>
  );
}
