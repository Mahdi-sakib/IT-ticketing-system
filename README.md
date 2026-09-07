# OmniDesk IT — Enterprise IT Service Management Platform

OmniDesk IT is a full-featured IT ticketing / ITSM platform: ticket
management, SLA + escalation tracking, asset & configuration management,
problem & change management, major incident coordination, a knowledge base,
a self-service catalog, an AI-assisted helpdesk chatbot, a no-code automation
engine, and executive analytics — a React frontend backed by a real Node.js
API and database.

## Feature set

OmniDesk IT implements a full base ITSM feature set plus a wide range of
advanced enterprise features: AI classification & routing, an SLA/escalation
engine, Major Incident Management, Problem Management, Change Management,
CMDB, a Service Catalog, a no-code Automation Engine, Asset Lifecycle
tracking, an AI helpdesk chatbot, real-time notifications, CSAT, an advanced
knowledge base, executive analytics with AI-generated insights, a full audit
trail, role-based security, and multi-department/location support.

## Tech stack

- **React 18** + **Vite** — fast dev server and build
- **react-router-dom v6** — client-side routing
- **Tailwind CSS** — utility-first styling with a small hand-rolled UI kit
  (buttons, dialogs, tabs, tables, dropdowns, etc.) that mirrors the
  shadcn/ui visual language without a Radix dependency
- **Recharts** — analytics charts
- **sonner** — toast notifications
- **date-fns**, **lucide-react**, **uuid**, **clsx** / **tailwind-merge**

The frontend talks to a real backend — **Node.js + Express + Prisma +
SQLite** (see [`server/`](./server)) — for persistence, authentication, and
every read/write in the app. Passwords are hashed with bcrypt and sessions
use JWTs; nothing sensitive is ever kept in `localStorage`. See
[Architecture](#architecture) below for how the two halves fit together.

## Getting started

One-time setup (installs both the frontend and backend, and creates the
SQLite database):

```bash
npm run setup
```

Then, every time you want to run the app:

```bash
npm run dev
```

This starts the Vite dev server (`http://localhost:5173`) *and* the API
server (`http://localhost:4000`) together, with Vite proxying `/api` to the
backend so there's nothing extra to configure. The first time the backend
starts against an empty database it seeds itself with realistic demo data
(users, tickets, assets, knowledge base articles, etc.) automatically — no
separate seed step required.

Prefer two terminals? `npm run dev:web` and `npm run dev:api` start each
half on its own.

### Demo accounts

All demo accounts use the password **`demo1234`**:

| Role       | Email                     |
|------------|---------------------------|
| Admin      | admin@omnidesk.dev        |
| IT Agent   | agent@omnidesk.dev        |
| IT Agent   | agent2@omnidesk.dev       |
| Employee   | employee@omnidesk.dev     |
| Employee   | rafiul.islam@omnidesk.dev |
| Employee   | sadia.afrin@omnidesk.dev  |

The login page also has one-click buttons for these demo accounts, and a
"Continue with Google" button that simulates an OAuth consent flow (no real
Google account is contacted).

### Resetting demo data

Sign in as an admin and go to **System Settings > Danger Zone > Reset Demo
Data** — this wipes the SQLite database on the server and reseeds it.

## Feature overview

**Core ticketing**
- Ticket creation with category/subcategory, priority, department, location,
  contact method, file attachment, and optional asset linking
- Full conversation thread (public replies + internal-only notes for staff),
  attachment support, activity history timeline
- Role-based dashboards (employee vs. agent/admin), "My Tickets" / "All
  Tickets" views with rich filtering and search
- SLA due-date calculation and live countdown/breach badges

**AI & automation** (`src/lib/ai.js`, `src/lib/automation.js`)
- Heuristic AI ticket classification (category/subcategory/priority),
  duplicate detection, smart agent auto-routing by skill + current load
- AI-drafted resolution summaries and ticket summarization
- A background SLA/escalation engine that auto-escalates breached tickets
- A no-code automation rule builder (Admin > System Settings) — simple
  `field=value` condition/action rules, e.g. "if category = Cybersecurity,
  set priority = critical and route to Security Team"
- An AI helpdesk chatbot widget (bottom-right, all authenticated pages) that
  answers from the knowledge base or offers to open a ticket
- AI-generated "Executive Insights" on the Analytics page

> **Note:** the "AI" here is a fast, fully offline, rule/heuristic
> implementation — there is no external LLM call, so the app works with zero
> API keys. Every AI function lives in `src/lib/ai.js` with a clear,
> single-purpose signature, so swapping in a real model (e.g. the Claude
> API) later is a matter of replacing each function's body — see the
> comments at the top of that file.

**ITSM modules**
- **Assets** — full lifecycle tracking (purchase, warranty, depreciation,
  assignment history, maintenance log)
- **CMDB** — configuration items with type/environment/status and
  dependency mapping
- **Problem Management** — root cause tracking, workarounds, linked tickets
- **Change Management** — standard/normal/emergency changes with impact,
  implementation, rollback and testing plans, and CAB approve/reject
- **Major Incident Management** — declare, assign an incident commander,
  post a running status timeline, and resolve
- **Knowledge Base** — categorized self-service articles with view/helpful
  counters
- **Service Catalog** — one-click requests for common IT services
  (onboarding, VPN access, new hardware, etc.) that create a tracked ticket

**Admin & reporting**
- User management (create/disable/reset password/change role)
- Full audit log of administrative and data changes
- Executive analytics: KPIs, ticket volume trend, category/status
  breakdowns, per-agent performance, CSV export and print-to-PDF
- Role-based access control throughout (`employee` / `agent` / `admin`),
  plus a "Preview as" role switcher for staff to sanity-check other roles'
  views

## Project structure

```
src/
  api/            frontend data layer — an in-memory cache in front of the
                  real API (db.js, entities.js, authToken.js)
  components/     shared UI (Layout, badges, notification center, chatbot...)
    ui/           small hand-built UI kit (button, dialog, table, tabs...)
    ticket/       ticket-detail sub-components (conversation, history...)
    analytics/    chart components (Recharts wrappers)
  lib/            auth context, constants, AI/automation logic, utils
  pages/          route-level screens
    admin/        admin-only screens (users, audit logs, settings)
server/           Express + Prisma + SQLite backend (see below)
```

## Architecture

**Backend** (`server/`) is a small Express API on top of a single Prisma/
SQLite table (`Item: {id, collection, data}`) — every OmniDesk IT entity
(tickets, users, assets, ...) is stored as one JSON document per row, keyed
by collection name. This mirrors the flexible per-entity shape the app
already used, so no rigid per-field schema was needed for 16 entity types.
Key endpoints:

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` —
  bcrypt password hashing, JWT sessions.
- `GET /api/bootstrap` — the entire dataset in one call (passwords always
  stripped).
- `POST/PATCH/DELETE /api/collections/:name[/:id]` — generic CRUD, requires
  a valid JWT.
- `POST /api/reset` — wipes and reseeds the database (used by Admin >
  System Settings).

**Frontend** (`src/api/db.js`) fetches the whole dataset once via
`bootstrap()` into an in-memory cache. `list/filter/get/count` read that
cache synchronously (so every existing page's code — which was written
assuming synchronous local reads — kept working unchanged), while
`create/update/delete/bulkCreate` update the cache immediately for a snappy
UI and persist to the server in the background. If a background sync fails
(e.g. the API is down), it's logged to the console rather than silently
lost. Auth (`src/lib/AuthContext.jsx`) talks to the server directly, since
passwords are never present in the cache.

To swap in a different database later, only `server/prisma/schema.prisma`
and `server/src/store.js` need to change — the routes, and the entire
frontend, are unaffected.

## Building for production

```bash
npm run build   # frontend — outputs a static build in dist/
```

The frontend build is static and can be hosted anywhere (Vercel, Netlify,
S3, etc.); set `VITE_API_URL` at build time if the API isn't served from the
same origin under `/api`. The backend (`server/`) is a normal long-running
Node process — deploy it anywhere Node runs (a VM, Render, Railway, Fly.io,
etc.) with a persistent disk for `server/prisma/dev.db`, or point
`DATABASE_URL` at a hosted Postgres/MySQL instance and adjust the Prisma
`provider` accordingly.

---

Built with the help of Claude.
