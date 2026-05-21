import { useState } from 'react';
import ReleasesSection from './ReleasesSection';
import AdoptionSection from './AdoptionSection';

const TABS = ['Releases', 'Adoption'];

export default function ServiceDetail({ service, githubToken }) {
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
      {activeTab === 'Releases' && <ReleasesSection service={service} githubToken={githubToken} />}
      {activeTab === 'Adoption' && <AdoptionSection />}
    </div>
  );
}
