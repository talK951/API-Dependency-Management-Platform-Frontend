# API Dependency Management Platform — Frontend

## Project Overview

React SPA that serves as a management UI for the API Dependency Management Platform backend. It lets users manage organizations, accounts, and REST services (with OpenAPI specs), and validate raw HTTP requests against stored specs.

## Stack

- **Framework**: React 19 (Create React App)
- **Language**: JavaScript (no TypeScript)
- **Styling**: Plain CSS ([App.css](my-app/src/App.css), [index.css](my-app/src/index.css))
- **No component library** — all UI is hand-rolled except `swagger-ui-react` for OpenAPI spec rendering
- **No router** — page switching is state-based in [App.js](my-app/src/App.js)

## Project Structure

```
Frontend/
└── my-app/
    ├── public/
    ├── src/
    │   ├── App.js                      # Root component: auth flow + authenticated layout
    │   ├── App.css                     # All styles
    │   ├── index.css
    │   ├── index.js
    │   │
    │   ├── utils/
    │   │   ├── api.js                  # BASE constant (backend URL)
    │   │   ├── session.js              # saveSession / loadSession / clearSession
    │   │   └── github.js               # fetchGithubFile (GitHub Contents API helper)
    │   │
    │   ├── components/
    │   │   ├── ServicesSidebar.js      # Left sidebar: lists services + GitHub repos
    │   │   ├── ConnectGithubTab.js     # GitHub connect button (used in sidebar)
    │   │   ├── AccountTab.js           # Account button (used in sidebar)
    │   │   └── EmptyState.js           # Shown in main area when no service is selected
    │   │
    │   └── pages/
    │       ├── Welcome.js              # Landing — Login / Sign Up buttons
    │       ├── Login.js                # Login form → POST /auth/login
    │       ├── RegisterOrganization.js # Create org → redirects to RegisterAccount
    │       ├── RegisterAccount.js      # Create account (fetches org list for dropdown)
    │       ├── ServiceDetail.js        # Tab shell for a selected service
    │       ├── ReleasesSection.js      # Releases tab: fetches Releases.json + OpenAPI specs
    │       └── AdoptionSection.js      # Adoption tab (placeholder)
    ├── .env
    └── package.json
```

## Dev Commands

```bash
cd my-app
npm start    # dev server at http://localhost:3000
npm run build
npm test
```

## Environment

`.env` (in `my-app/`):

```
REACT_APP_API_HOST=localhost:8080
REACT_APP_GITHUB_CLIENT_ID=<your-github-oauth-app-client-id>
```

The backend base URL is centralised in `utils/api.js`:

```js
export const BASE = `http://${process.env.REACT_APP_API_HOST}/API-Management-Server`;
```

---

## App Layout & Auth Flow

**Unauthenticated flow** (state machine in `App.js`, driven by `authPage` string):

```
welcome → login → (main app, accountId stored in localStorage)
welcome → register-org → register-account → login
```

**Authenticated layout** (`div.layout`):
- `nav.sidebar-services` (left) — `ServicesSidebar` fetches `GET /accounts/{id}/services` and GitHub repos; clicking a service renders `ServiceDetail` in the main area
- `main.content` (center) — renders `ServiceDetail` or `EmptyState`

Session (`accountId`) and GitHub token (`githubAccessToken`) are persisted in `localStorage`. Helpers in `utils/session.js` manage the session; the GitHub token is managed directly in `App.js`.

---

## GitHub Integration

Repos are fetched via GitHub OAuth (scope: `repo`). Only repos with an `api-dep-folder` directory at the root of their default branch appear in the sidebar. The folder check is done with a parallel `GET /repos/{owner}/{repo}/contents/api-dep-folder` call for every repo returned by `GET /user/repos`.

### api-dep-folder convention

Each qualifying repo must have an `api-dep-folder/` directory containing:

| File | Description |
|------|-------------|
| `Releases.json` | List of releases (see format below) |
| `openAPI.json` or `openAPI.yml` | OpenAPI spec at each release's commit |

**Releases.json format:**
```json
{
  "projectTitle": "My Service",
  "releases": [
    { "version": "v1.0.0", "releaseTitle": "Initial release", "commithash": "<full SHA>" }
  ]
}
```

The `fetchGithubFile` utility in `utils/github.js` handles fetching and base64-decoding any file from GitHub's Contents API.

---

## Service Detail — Tabs

`ServiceDetail.js` is a thin tab shell. Each tab is its own component:

| Tab | Component | Status |
|-----|-----------|--------|
| Releases | `ReleasesSection.js` | Implemented |
| Adoption | `AdoptionSection.js` | Placeholder |

`ReleasesSection` fetches `Releases.json`, renders a list of release cards, and on click fetches the OpenAPI spec at that commit and renders it with `swagger-ui-react`.

---

## Backend API (current)

**Spring Boot 3.3 / Java 21 / PostgreSQL / JPA+Hibernate / Lombok**

- Context path: `/API-Management-Server`
- CORS: `@CrossOrigin(origins = "http://localhost:3000")` on `BackendApplication` only
- Database: PostgreSQL `localhost:5432/API_Dep_Man_Platform_DB` (user `postgres`, pass `12345lof`)
- `spring.jpa.hibernate.ddl-auto=update`

### Auth — /auth

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/auth/login` | `{ username, password }` | Account JSON (includes `id`) or error text |
| POST | `/auth/github/callback` | `{ code }` | `{ accessToken }` |

### Organizations — /organizations

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/organizations` | `{ orgName }` | Created Organization JSON |
| GET | `/organizations` | — | List of all Organization JSON |
| GET | `/organizations/{id}` | — | Organization JSON or 404 |
| PUT | `/organizations/{id}` | `{ orgName }` | Updated Organization JSON or 404 |
| DELETE | `/organizations/{id}` | — | 204 No Content or 404 |

### Accounts — /accounts

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/accounts` | `{ name, username, hashedPass, email, organization: { Id } }` | Created Account JSON |
| GET | `/accounts/{id}` | — | Account JSON or 404 |
| GET | `/accounts/{id}/services` | — | List of RestService JSON for that account |
| PUT | `/accounts/{id}` | `{ name, username, hashedPass, email }` | Updated Account JSON or 404 |
| DELETE | `/accounts/{id}` | — | 204 No Content or 404 |

### REST Services — /services

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/services` | `{ serviceName, specFile, organization: { Id } }` | Created RestService JSON |
| GET | `/services/{id}` | — | RestService JSON or 404 |
| PUT | `/services/{id}` | `{ serviceName, specFile }` | Updated RestService JSON or 404 |
| DELETE | `/services/{id}` | — | 204 No Content or 404 |

### Utility

| Method | Path | Notes |
|--------|------|-------|
| GET | `/` | Health check |
| GET | `/PrintSystem` | Tree view of all orgs, accounts, services |
| POST | `/IsRequestValid?orgId=&serviceName=` | body: raw HTTP as `text/plain` |

---

## Data Model

**Organization** — `id`, `orgName` (unique, max 100)

**Account** — `id`, `name`, `username` (unique), `hashedPass`, `email` (unique), `organization` (ManyToOne)

**RestService** — `id`, `serviceName` (unique, max 100), `specFile` TEXT, `organization` (ManyToOne), `accounts` (ManyToMany)

---

## UI Patterns

**Auth pages** (`Welcome`, `Login`, `RegisterOrganization`, `RegisterAccount`) use `div.auth-page > div.card.auth-card` and navigate via the `onNavigate(key)` prop from `App`.

**CRUD pages** follow a consistent pattern with a local `FormCard` wrapper (`div.card`) and a local `ResponseBox` for API feedback. These are not shared — each page defines its own copy.
