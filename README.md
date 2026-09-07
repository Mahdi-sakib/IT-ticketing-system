# OmniDesk IT — Enterprise IT Service Management Platform

OmniDesk IT is a full-featured IT ticketing / ITSM platform: ticket
management, SLA + escalation tracking, asset & configuration management,
problem & change management, major incident coordination, a knowledge base,
a self-service catalog, an AI-assisted helpdesk chatbot, a no-code automation
engine, and executive analytics — all running as a single, self-contained
React application.

## A note on how this repository came to be

This app's requirements were originally built and prototyped in
[Base44](https://base44.app) (a no-code AI app builder) under the project
name "steady-omni-desk-flow". Base44's Free plan does not allow exporting a
project as source code or connecting it to GitHub (`Export as ZIP` and
`GitHub sync` are both paid-plan features), so a literal file-for-file copy
wasn't possible.

Instead, this codebase is a **from-scratch, functionally complete rebuild**
implementing the exact same specification — the full base ITSM feature set
plus all 30 advanced enterprise features originally requested (AI
classification & routing, SLA/escalation engine, Major Incident Management,
Problem Management, Change Management, CMDB, Service Catalog, a no-code
Automation Engine, Asset Lifecycle tracking, an AI helpdesk chatbot,
real-time notifications, CSAT, an advanced knowledge base, executive
analytics with AI-generated insights, a full audit trail, role-based
security, multi-department/location support, and more).

A handful of entity schemas were captured directly from the original Base44
project's read-only code viewer and are kept as reference documentation
under [`base44/entities/`](./base44/entities) (`Asset.jsonc`,
`AutomationRule.jsonc`, `ChangeRequest.jsonc`, `ConfigurationItem.jsonc`,
`CsatResponse.jsonc`) — these were used as the authoritative source for the
matching data models in this rebuild. The rest of the app's ~90 files were
written new, following the same architecture conventions (role-based access,
`display_id`/`created_date` style fields, etc.) inferred from those schemas
and the full product specification.

## Tech stack

- **React 18** + **Vite** — fast dev server and build
- **react-router-dom v6** — client-side routing
- **Tailwind CSS** — utility-first styling with a small hand-rolled UI kit
  (buttons, dialogs, tabs, tables, dropdowns, etc.) that mirrors the
  shadcn/ui visual language without a Radix dependency
- **Recharts** — analytics charts
- **sonner** — toast notifications
- **date-fns**, **lucide-react**, **uuid**, **clsx** / **tailwind-merge**

There is **no external backend** — the app uses `localStorage` as a mock
document database (see `src/api/db.js`), so it runs completely standalone
with zero configuration. This makes it trivial to demo, but also means data
is per-browser; see "Swapping in a real backend" below for how to connect it
to a real API.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. The first time the app loads, it seeds
itself with realistic demo data (users, tickets, assets, knowledge base
articles, etc.) automatically — no separate seed step required.

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
Data**, or simply clear the `omnidesk_it_v1` key from your browser's
localStorage and refresh.

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
  api/            localStorage-backed data layer (db.js, entities.js)
  components/     shared UI (Layout, badges, notification center, chatbot...)
    ui/           small hand-built UI kit (button, dialog, table, tabs...)
    ticket/       ticket-detail sub-components (conversation, history...)
    analytics/    chart components (Recharts wrappers)
  lib/            auth context, constants, AI/automation logic, utils
  pages/          route-level screens
    admin/        admin-only screens (users, audit logs, settings)
base44/entities/  reference copies of the original Base44 entity schemas
```

## Swapping in a real backend / integrations

This app was intentionally built with clean seams so each "fake" piece can
be swapped for a real one without touching the rest of the app:

- **Data storage**: replace the implementation inside `src/api/db.js`
  (`makeCollection`) with real API calls — every page only ever imports
  from `src/api/entities.js`, so no page code needs to change.
- **Authentication / SSO**: `src/lib/AuthContext.jsx` centralizes
  login/register/logout; swap in real SSO (Google/Microsoft OAuth, SAML) by
  replacing `login`/`register` and the `/oauth-consent` page.
- **AI**: replace the function bodies in `src/lib/ai.js` with calls to a
  real LLM (e.g. the Claude API) — keep the same input/output shapes and
  nothing else needs to change.
- **Email / Microsoft Teams notifications**: hook into
  `src/api/entities.js`'s `Notifications` collection (or add a new
  `sendEmail`/`sendTeamsMessage` helper) at the same call sites that already
  create in-app notifications.

## Building for production

```bash
npm run build
npm run preview
```

The production build is fully static and can be hosted on any static file
host (Vercel, Netlify, GitHub Pages, S3, etc.).

---

Generated with the help of Claude. See `base44/entities/*.jsonc` for the
original scraped Base44 schemas this rebuild was anchored to.
