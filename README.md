# Village Connect

A community portal for residential societies — built with React, Express, PostgreSQL, and Drizzle ORM.

## Features

- **Authentication** — Register / login with sessions stored in PostgreSQL
- **Resident Directory** — Browse neighbours, request contact info
- **Announcements** — Admin posts, all residents notified automatically
- **Meetings** — Schedule community meetings with video call links
- **Marketplace** — Buy, sell or give away items within the community
- **Notifications** — In-app notifications for all activity
- **Admin Panel** — Manage residents, promote to admin, approve contact requests
- **Dark Mode** — Toggle light/dark theme, persisted in localStorage

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express 5, TypeScript, tsx |
| Database | PostgreSQL 16 + Drizzle ORM |
| Sessions | express-session + connect-pg-simple |
| Monorepo | npm workspaces |
| Container | Docker + Docker Compose |

---

## Quick Start (Local Development)

### 1. Prerequisites

- Node.js 20+
- PostgreSQL 16 running locally **or** Docker

### 2. Clone & install

```bash
git clone <repo-url>
cd village-connect
npm install
```

### 3. Environment

```bash
cp .env.example .env
# Edit .env and set DATABASE_URL if needed
```

Default `.env`:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/village_connect
PORT=3001
SESSION_SECRET=change-me
NODE_ENV=development
VITE_API_URL=http://localhost:3001
```

### 4. Create the database

```bash
# If using local postgres:
createdb village_connect

# Or spin up postgres in Docker:
docker run -d \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=village_connect \
  -p 5432:5432 \
  postgres:16-alpine
```

### 5. Push schema & seed

```bash
npm run db:push       # creates all tables
npm run db:seed       # adds sample data
```

### 6. Start development servers

```bash
npm run dev           # starts both server (3001) and client (5173)
```

Open http://localhost:5173

**Default logins:**
- Admin: `admin@village.com` / `admin123`
- Resident: `priya@village.com` / `password123`

---

## Docker Compose (Production-like)

```bash
docker compose up --build
```

This starts:
- **postgres** on port 5432
- **server** on port 3001
- **client** (nginx) on port 5173

After first start, run migrations inside the server container:
```bash
docker compose exec server sh -c "cd /app && npm run db:push --workspace=database"
```

---

## Project Structure

```
village-connect/
├── database/               # Drizzle ORM schemas & migrations
│   ├── src/
│   │   ├── schema/         # Table definitions
│   │   │   ├── users.ts
│   │   │   ├── announcements.ts
│   │   │   ├── meetings.ts
│   │   │   ├── listings.ts
│   │   │   ├── notifications.ts
│   │   │   ├── contact-requests.ts
│   │   │   └── sessions.ts
│   │   ├── index.ts        # DB connection
│   │   └── seed.ts         # Sample data
│   └── drizzle.config.ts
│
├── server/                 # Express API
│   └── src/
│       ├── routes/         # auth, users, announcements, meetings, marketplace, notifications, contact-requests, dashboard
│       ├── middlewares/    # requireAuth, requireAdmin
│       ├── lib/            # safeUser helper
│       ├── app.ts          # Express setup (CORS, sessions)
│       └── index.ts        # Entry point
│
├── client/                 # React frontend
│   └── src/
│       ├── components/
│       │   └── Layout.tsx  # Sidebar, dark mode toggle, mobile nav
│       ├── pages/          # All page components
│       ├── hooks/          # useAuth, useDebounce
│       └── lib/            # api client, utils
│
├── .env.example
├── docker-compose.yml
└── package.json            # npm workspaces root
```

---

## API Overview

All API routes are under `/api` and require a session cookie (except auth endpoints).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/logout` | ✓ | Logout |
| GET | `/api/auth/me` | ✓ | Current user |
| GET | `/api/users` | ✓ | List residents |
| GET | `/api/users/:id` | ✓ | Resident profile |
| PATCH | `/api/users/:id/profile` | ✓ | Update profile |
| GET | `/api/announcements` | ✓ | List announcements |
| POST | `/api/announcements` | Admin | Create announcement |
| DELETE | `/api/announcements/:id` | Admin | Delete |
| GET | `/api/meetings` | ✓ | List meetings |
| POST | `/api/meetings` | Admin | Schedule meeting |
| DELETE | `/api/meetings/:id` | Admin | Delete |
| GET | `/api/marketplace` | ✓ | List listings |
| POST | `/api/marketplace` | ✓ | Create listing |
| DELETE | `/api/marketplace/:id` | Owner/Admin | Delete |
| GET | `/api/notifications` | ✓ | List notifications |
| PATCH | `/api/notifications/read-all` | ✓ | Mark all read |
| PATCH | `/api/notifications/:id/read` | ✓ | Mark one read |
| GET | `/api/contact-requests` | ✓ | List requests |
| POST | `/api/contact-requests` | ✓ | Send request |
| PATCH | `/api/contact-requests/:id/respond` | ✓ | Approve/reject |
| GET | `/api/dashboard/summary` | ✓ | Dashboard stats |


