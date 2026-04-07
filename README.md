# OuchTracker — Injury & Kit Tracker

A full-stack web application for managing first-aid kits across an organisation. Admins configure kits and users; checkers inspect kits, record incidents, and track item stock in real time.

https://athamour1.github.io/ouchtracker/

**Dev article:** https://thanos.mourtzoukos.space/projects/ouchtracker/

---

## Features

### Admin
- **Kit management** — create, edit, delete kits with name, location, and description
- **Multi-assignee** — assign one or more checker users to each kit
- **Item management** — add, edit, delete items per kit (name, category, unit, quantity, expiry date, location in kit, notes)
- **CSV import** — bulk-import kit items from a CSV file
- **BoM PDF export** — export a beautifully formatted Bill of Materials PDF per kit, including item table grouped by category, expiry status colour-coding, kit QR code, and summary stats — ready to print and insert into the physical kit
- **QR codes** — generate and download a QR code per kit that links directly to the kit landing page
- **User management** — create/manage admin and checker accounts
- **Incident reports** — view all incident reports across kits with expandable detail and vertical scroll
- **Inspection history** — view all inspection logs across kits with expandable detail and inspector notes
- **Dashboard** — summary widgets (total kits, items, expiring soon, already expired) + items needing attention panel
- **Kit filter** — filter inspection and incident logs by kit

### Checker
- **Assigned kits** — see only kits assigned to them
- **Kit inspection** — search and filter items, step through each item, record quantity found and notes, submit an inspection log
- **Incident report** — search kit items, select items used, record quantities and paragraph notes per item, submit a report (automatically deducts stock)
- **My history** — view own inspection and incident report history (identical layout to admin tables)
- **Dashboard** — personal summary of assigned kits, expired and expiring items

### General
- **Role-based access control** — JWT-authenticated, `ADMIN` / `CHECKER` roles enforced on every endpoint
- **Dark mode** — full dark-mode support toggled from the header, preference persisted in `localStorage`
- **Expiry tracking** — items flagged as expired or expiring within 30 days with colour-coded indicators
- **Responsive UI** — works on desktop and mobile; drawer starts closed on mobile
- **PWA** — installable on any device, offline-resilient via Workbox `NetworkFirst` caching, auto-updates on new deploy
- **Rounded UI** — consistent rounded buttons, inputs, cards, dialogs, banners and notifications throughout

---

## Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | Vue 3 · Quasar Framework v2 · TypeScript · Pinia · Vue Router (hash mode) |
| Backend   | NestJS v11 · TypeScript |
| ORM       | Prisma 7 (`@prisma/adapter-pg`) |
| Database  | PostgreSQL 16 |
| Auth      | JWT (Bearer token) + bcrypt |
| Container | Docker + Docker Compose |
| PWA       | Workbox `GenerateSW` · Web App Manifest · Service Worker |

---

## Progressive Web App

OuchTracker is a fully installable PWA:

- **Installable** — browsers show an "Add to Home Screen" / install prompt
- **Offline resilient** — Workbox `NetworkFirst` strategy caches recent API responses for 5 minutes; static assets are pre-cached at build time
- **Auto-update** — service worker uses `skipWaiting + clientsClaim`; users are prompted to reload when a new version is available
- **Theme** — `theme_color: #c62828` (red) applied to browser chrome and mobile status bar
- **Icons** — medical suitcase icon in all required sizes (128 → 512 px) including maskable for Android adaptive icons

The production nginx config serves `sw.js` with `no-store` headers so the browser always checks for updates, while all other static assets get a 1-year immutable cache.

---

## Data Model (summary)

```
User ──< KitAssignees >── Kit ──< KitItem
                           │         │
                           │         └──< InspectionLogItem >── InspectionLog >── User
                           │         └──< IncidentReportItem >── IncidentReport >── User
                           └──< InspectionLog
                           └──< IncidentReport
```

- **User** — `ADMIN` or `CHECKER`, many-to-many with kits
- **Kit** — physical first-aid kit box/bag at a location
- **KitItem** — item in a kit (no global catalog; items are kit-specific)
- **InspectionLog** — one record per inspection session with per-item snapshots
- **IncidentReport** — records items consumed during an incident, deducts stock

---

## Getting Started

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2+

### Development

```bash
docker compose -f docker-compose.dev.yml up --build
```

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:9000       |
| Backend  | http://localhost:3000/api  |
| Postgres | localhost:5432             |

The backend runs in watch mode (hot-reload). The frontend runs Quasar's PWA dev server (`quasar dev -m pwa`) with HMR — the service worker is active in dev too.

**Default admin credentials** (seeded on first start):

| Field    | Value                  |
|----------|------------------------|
| Email    | `admin@ouchtracker.local`   |
| Password | `Admin1234!`           |

Override via environment variables before starting:
```bash
SEED_ADMIN_EMAIL=you@example.com \
SEED_ADMIN_PASSWORD=YourPassword1! \
docker compose -f docker-compose.dev.yml up --build
```

### Production

Pre-built images are published to GitHub Container Registry by `release.sh`:
- `ghcr.io/athamour1/ouchtracker/backend`
- `ghcr.io/athamour1/ouchtracker/frontend`

1. Copy the example env file and fill in secrets:
   ```bash
   cp .env.prod.example .env.prod
   # edit .env.prod
   ```

2. Pull and start (uses the `latest` tag by default):
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
   ```

3. To deploy a specific release:
   ```bash
   IMAGE_TAG=v1.2.0 docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
   ```

The app is available on port **80**. Nginx serves the Quasar PWA (built with `quasar build -m pwa`) and proxies `/api` to the NestJS backend. The service worker (`sw.js`) is served with `no-store` headers so updates are picked up immediately. The database port is not exposed publicly.

#### Releasing a new version

```bash
./release.sh
```

The script will:
1. Prompt for a semver version (e.g. `1.2.0`)
2. Build and push `backend` and `frontend` Docker images to GHCR (tagged `:vX.Y.Z` and `:latest`)
3. Create an annotated Git tag and a GitHub release with auto-generated notes

#### Required `.env.prod` variables

```env
DB_USER=ouchtracker
DB_PASSWORD=change_me
DB_NAME=ouchtracker_db

JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES_IN=8h

CORS_ORIGIN=https://your-domain.com
API_URL=/api

SEED_ADMIN_EMAIL=admin@your-domain.com
SEED_ADMIN_PASSWORD=StrongPassword1!
SEED_ADMIN_NAME=System Admin

# Optional: pin to a specific release tag (default: latest)
IMAGE_TAG=latest
```

---

## Project Structure

```
OuchTracker/
├── backend/                  # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma     # Data models
│   │   ├── migrations/       # SQL migration history
│   │   ├── seed.ts           # Development seed (20 users, 10 kits, 300+ items, inspections & incidents)
   └── seed.prod.ts      # Production seed (admin user only)
│   └── src/
│       ├── auth/             # JWT auth, guards, decorators
│       ├── users/            # User CRUD (admin only)
│       ├── kits/             # Kit + KitItem CRUD
│       ├── inspections/      # Inspection log endpoints
│       ├── incidents/        # Incident report endpoints
│       ├── alerts/           # Dashboard summary endpoint
│       └── common/           # Filters, pipes, shared utilities
│
├── frontend/                 # Vue 3 + Quasar SPA
│   └── src/
│       ├── pages/
│       │   ├── admin/        # Admin pages (kits, users, reports, dashboard)
│       │   ├── checker/      # Checker pages (my kits, inspection, history)
│       │   ├── KitLandingPage.vue   # QR code landing (3-button hub)
│       │   └── IncidentReportPage.vue
│       ├── components/       # Shared components (StatCard, NavItem, KitQrDialog, ExpiryBadge…)
│       ├── composables/      # useNotify, useKitPdf (BoM PDF export)
│       ├── stores/           # Pinia stores (auth)
│       ├── services/         # Axios API client + TypeScript interfaces
│       └── layouts/          # AppLayout (drawer + header)
│
├── docker-compose.dev.yml
├── docker-compose.prod.yml
└── README.md
```

---

## API Overview

All routes are prefixed with `/api`.

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | Public | Obtain JWT |
| GET | `/auth/me` | Any | Current user info |
| GET/POST | `/users` | Admin | List / create users |
| PATCH/DELETE | `/users/:id` | Admin | Update / delete user |
| GET/POST | `/kits` | Admin | List all / create kit |
| GET | `/kits/my` | Checker | List assigned kits |
| GET | `/kits/:id` | Any* | Get kit with items |
| PATCH/DELETE | `/kits/:id` | Admin | Update / delete kit |
| PATCH | `/kits/:id/assign` | Admin | Set kit assignees |
| POST | `/kits/:id/items` | Any* | Add item to kit |
| PATCH/DELETE | `/kits/:id/items/:itemId` | Any* | Update / delete item |
| POST | `/kits/:id/items/import-csv` | Any* | Bulk import items |
| GET/POST | `/inspections` | Any* | List / create inspection |
| GET | `/inspections/:id` | Any* | Get inspection detail |
| GET/POST | `/incidents` | Any* | List / create incident report |
| GET | `/incidents/:id` | Admin | Get incident detail |
| GET | `/alerts/summary` | Admin | Dashboard summary |

*Checkers are restricted to kits they are assigned to.

---

## CSV Import Format

Kit items can be imported via **Admin → Kit Detail → Import CSV**. The file must have the following columns (header row required):

```csv
name,category,unit,quantity,expirationDate,locationInKit,notes
Surgical Mask,PPE,pcs,50,2026-12-31,Front Pocket,
Bandage 10cm,Wound Care,roll,10,,Main Compartment,Check stock monthly
```

| Column | Required | Format |
|--------|----------|--------|
| `name` | Yes | Text |
| `category` | No | Text |
| `unit` | No | Text (default: `pcs`) |
| `quantity` | No | Integer (default: `0`) |
| `expirationDate` | No | `YYYY-MM-DD` |
| `locationInKit` | No | Text |
| `notes` | No | Text |

---

## QR Code Workflow

1. Admin opens **Kits** page and clicks the QR icon on any kit row.
2. A dialog shows the QR code for that kit's landing page URL.
3. The QR can be downloaded as a PNG and printed/attached to the kit.
4. Scanning the QR opens the **Kit Landing Page** (authentication required), which shows three action buttons:
   - **Incident Report** — record items used in an incident
   - **Kit Contents** — view / edit the kit's item list
   - **Start Inspection** — begin a checklist inspection
