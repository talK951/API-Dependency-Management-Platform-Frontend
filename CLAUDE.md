# API Dependency Management Platform — Frontend

## Project Overview

React SPA that serves as a management UI for the API Dependency Management Platform backend. It lets users manage organizations, accounts, and REST services (with OpenAPI specs), and validate raw HTTP requests against stored specs.

## Stack

- **Framework**: React 19 (Create React App)
- **Language**: JavaScript (no TypeScript)
- **Styling**: Plain CSS ([App.css](my-app/src/App.css), [index.css](my-app/src/index.css))
- **No component library** — all UI is hand-rolled
- **No router** — page switching is state-based in [App.js](my-app/src/App.js)

## Project Structure

```
Frontend/
└── my-app/
    ├── public/
    ├── src/
    │   ├── App.js          # Root: auth flow, layout, ServicesSidebar
    │   ├── App.css
    │   ├── index.css
    │   ├── index.js
    │   └── pages/
    │       ├── Welcome.js              # Landing — Login / Sign Up buttons
    │       ├── Login.js                # Login form → POST /auth/login
    │       ├── RegisterOrganization.js # Create org → redirects to RegisterAccount
    │       ├── RegisterAccount.js      # Create account (fetches org list for dropdown)
    │       ├── ServiceDetail.js        # Shows detail for a service selected in sidebar
    │       ├── Organizations.js        # CRUD for organizations
    │       ├── Accounts.js             # CRUD for accounts
    │       ├── OpenApiFiles.js         # CRUD for REST services / OpenAPI specs
    │       ├── ValidateRequest.js      # Validate raw HTTP against a stored spec
    │       └── System.js               # GET /PrintSystem tree view
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
```

All pages build the API base URL as:

```js
const BASE = `http://${process.env.REACT_APP_API_HOST}/API-Management-Server`;
```

---

## App Layout & Auth Flow

**Unauthenticated flow** (state machine in `App.js`, driven by `authPage` string):

```
welcome → login → (main app, accountId stored)
welcome → register-org → register-account → login
```

**Authenticated layout** (`div.layout` with three columns):
- `nav.sidebar-services` (left) — `ServicesSidebar` fetches `GET /accounts/{id}/services` and lists them; clicking a service renders `ServiceDetail` in the main area instead of the current page
- `main.content` (center) — renders one of the five main pages or `ServiceDetail`
- `nav.sidebar-nav` (right) — page navigation buttons (Organizations, Accounts, OpenAPI Files, Validate Request, System)

`isLoggedIn` + `accountId` are stored in `App` state; there is no persistent session (no localStorage / cookies).

---

## Backend API (current)

**Spring Boot 3.3 / Java 21 / PostgreSQL / JPA+Hibernate / Lombok**

- Context path: `/API-Management-Server`
- CORS: `@CrossOrigin(origins = "http://localhost:3000")` is on `BackendApplication` only — the separate controllers do NOT have CORS headers
- Database: PostgreSQL `localhost:5432/API_Dep_Man_Platform_DB` (user `postgres`, pass `12345lof`)
- `spring.jpa.hibernate.ddl-auto=update` — schema is auto-managed, no manual migrations needed

### Auth — /auth

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/auth/login` | `{ username, password }` | Account JSON (includes `id`) or error text |

### Utility endpoints (BackendApplication.java)

| Method | Path | Params / Body | Notes |
|--------|------|---------------|-------|
| GET | `/` | — | Health check, returns "Application Started" |
| GET | `/PrintSystem` | — | Tree view of all orgs, their accounts, and services |
| POST | `/IsRequestValid` | query: `orgId` (long), `serviceName` (string); body: raw HTTP string as `text/plain` | Returns a pass/fail plain-text string |

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

---

## Data Model

**Organization**
- `id` Long (auto PK), `orgName` (unique, max 100)
- `accounts` List<Account> (OneToMany, cascade ALL, orphanRemoval)
- `restServices` List<RestService> (OneToMany, cascade ALL, orphanRemoval)

**Account**
- `id` Long (auto PK), `name` (max 100), `username` (unique, max 50), `hashedPass`, `email` (unique, max 150)
- `organization` Organization (ManyToOne, FK organization_id)
- `restServices` List<RestService> (ManyToMany via `account_services` join table)

**RestService**
- `id` Long (auto PK), `serviceName` (unique, max 100), `specFile` TEXT
- `organization` Organization (ManyToOne, FK organization_id)
- `accounts` List<Account> (ManyToMany, mappedBy)

---

## Key Changes from the Old API

The backend was fully rewritten — old endpoints no longer exist:

| Old endpoint | New endpoint |
|---|---|
| `POST /AddOrganization` | `POST /organizations` |
| `DELETE /DeleteOrganization?id=` | `DELETE /organizations/{id}` |
| `POST /AddAccount` body `{orgId,username,password}` | `POST /accounts` body `{name,username,hashedPass,email,organization:{Id}}` |
| `DELETE /DeleteAccount?orgId=&username=` | `DELETE /accounts/{id}` |
| `POST /Add-OpenApi-File/{orgId}` | `POST /services` |
| `POST /Update-OpenApi-File/{orgId}` | `PUT /services/{id}` |
| `DELETE /Delete-OpenApi-File?orgId=&projectName=` | `DELETE /services/{id}` |
| `POST /IsRequestValid?orgId=&projectName=` | `POST /IsRequestValid?orgId=&serviceName=` |

Frontend pages have been updated to match the new API.

---

## UI Patterns

**Auth pages** (`Welcome`, `Login`, `RegisterOrganization`, `RegisterAccount`) use `div.auth-page > div.card.auth-card` and navigate via the `onNavigate(key)` prop passed from `App`.

**Main CRUD pages** (`Organizations`, `Accounts`, `OpenApiFiles`, `ValidateRequest`, `System`) follow a consistent pattern:
- `FormCard` wrapper (`div.card`) with a title and form children (defined locally in each page file)
- `ResponseBox` shows success or error text returned from the API (defined locally in each page file)
- On success, form fields are cleared
- All fetch errors are caught and shown in the response box

`FormCard` and `ResponseBox` are **not shared components** — each page defines its own local copy.
