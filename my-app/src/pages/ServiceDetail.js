import { useState, useEffect } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import jsYaml from 'js-yaml';

const TABS = ['Releases', 'Adoption'];

async function fetchGithubFile(fullName, path, ref, token) {
  const url = ref
    ? `https://api.github.com/repos/${fullName}/contents/${path}?ref=${ref}`
    : `https://api.github.com/repos/${fullName}/contents/${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const err = new Error(`GitHub ${res.status}: ${path}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return atob(data.content.replace(/\n/g, ''));
}

function ReleasesSection({ service, githubToken }) {
  const [releasesLoading, setReleasesLoading] = useState(false);
  const [releasesError, setReleasesError] = useState(null);
  const [releases, setReleases] = useState(null);

  const [selectedRelease, setSelectedRelease] = useState(null);
  const [specLoading, setSpecLoading] = useState(false);
  const [specError, setSpecError] = useState(null);
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    if (!service.fullName || !githubToken) return;
    setReleasesLoading(true);
    setReleasesError(null);
    setReleases(null);
    setSelectedRelease(null);
    setSpec(null);
    setSpecError(null);

    fetchGithubFile(service.fullName, 'api-dep-folder/Releases.json', null, githubToken)
      .then(text => { setReleases(JSON.parse(text)); setReleasesLoading(false); })
      .catch(err => { setReleasesError(err.message); setReleasesLoading(false); });
  }, [service.fullName, githubToken]);

  useEffect(() => {
    if (!selectedRelease) return;
    setSpecLoading(true);
    setSpecError(null);
    setSpec(null);

    fetchGithubFile(service.fullName, 'api-dep-folder/openAPI.json', selectedRelease.commithash, githubToken)
      .then(text => { setSpec(JSON.parse(text)); setSpecLoading(false); })
      .catch(jsonErr => {
        if (jsonErr.status === 404) {
          fetchGithubFile(service.fullName, 'api-dep-folder/openAPI.yml', selectedRelease.commithash, githubToken)
            .then(text => { setSpec(jsYaml.load(text)); setSpecLoading(false); })
            .catch(yamlErr => {
              setSpecError(`OpenAPI spec not found (tried .json and .yml): ${yamlErr.message}`);
              setSpecLoading(false);
            });
        } else {
          setSpecError(`Failed to load OpenAPI spec: ${jsonErr.message}`);
          setSpecLoading(false);
        }
      });
  }, [selectedRelease, service.fullName, githubToken]);

  if (!service.fullName) {
    return (
      <div className="tab-panel">
        <p className="releases-placeholder">Releases are only available for GitHub-connected repositories.</p>
      </div>
    );
  }
  if (releasesLoading) return <div className="tab-panel"><p className="releases-loading">Loading releases...</p></div>;
  if (releasesError) return <div className="tab-panel"><p className="releases-error">Error loading releases: {releasesError}</p></div>;
  if (!releases) return <div className="tab-panel" />;

  const releaseList = releases.releases ?? [];

  return (
    <div className="tab-panel">
      {releaseList.length === 0 && (
        <p className="releases-placeholder">No releases found in Releases.json.</p>
      )}
      <div className="release-list">
        {releaseList.map(r => (
          <button
            key={r.version}
            className={`release-card${selectedRelease?.version === r.version ? ' release-card--active' : ''}`}
            onClick={() => setSelectedRelease(r)}
          >
            <span className="release-version">{r.version}</span>
            <span className="release-title">{r.releaseTitle}</span>
          </button>
        ))}
      </div>
      {selectedRelease && (
        <div className="spec-viewer">
          {specLoading && <p className="releases-loading">Loading OpenAPI spec...</p>}
          {specError && <p className="releases-error">{specError}</p>}
          {spec && !specLoading && <SwaggerUI spec={spec} />}
        </div>
      )}
    </div>
  );
}

function AdoptionSection() {
  return <div className="tab-panel" />;
}

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
