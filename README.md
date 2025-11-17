# MLM Platform - Binary Tree Multi-Level Marketing System

A professional, full-stack MLM platform with binary tree structure, real-time commission tracking, and modern black-themed UI.

## ✨ Features

### 🎨 Professional UI/UX

- Modern black theme with gradient accents
- Responsive design for all devices
- Glass-card effects and smooth transitions
- Professional header with user avatar dropdown
- Comprehensive dashboard with real-time stats

### 💰 Commission System

- **Direct Bonus**: Instant rewards for direct referrals
- **Matching Bonus**: Binary tree pair matching with daily caps
- **Transaction Safety**: Advisory locks prevent race conditions
- **Atomic Operations**: Database-level consistency
- **Configurable Parameters**: Easy commission tuning

### 🌳 Binary Tree Structure

- Sponsor-based referral system
- Left/Right leg placement
- BV (Business Volume) tracking with carry-forward
- Real-time tree visualization

Repository layout

- `backend/` — Node.js + Express API with Prisma
- `frontend/` — Next.js (TypeScript)
- `docker-compose.yml` — Postgres + Redis for development

Requirements

- Node.js 18+ and npm
- Docker (for local Postgres + Redis)
- Git

Quick start (development)

1. Ensure Docker is running, then start supporting services:

```bash
docker-compose up -d
```

````

1. Backend (in PowerShell)

```powershell
cd backend
Copy-Item .env.example .env
npm install
npx prisma generate
# Optional: apply migrations if present
npx prisma migrate dev --name init
npm run dev
```

1. Frontend (in PowerShell)

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Environment notes

- The frontend uses `NEXT_PUBLIC_API_URL` (default: `http://localhost:4000`) to locate the backend.
- The backend expects `DATABASE_URL` and `REDIS_URL`. When using docker-compose the service hostnames
  are `postgres` and `redis` respectively (see `backend/.env.example`).

Security notes

- Do not commit real credentials. Use a top-level `.env` (ignored by `.gitignore`) or CI secrets.
- Set `POSTGRES_PASSWORD` locally before starting the stack or create a local `.env` file:

```dotenv
POSTGRES_PASSWORD=ReplaceWithASecureRandomPassword!
```

Then run `docker-compose up -d`.

Useful files

- `backend/.env.example` — backend env sample
- `frontend/.env.example` — frontend env sample
- `docker-compose.yml` — development Postgres + Redis

Development notes

- API base URL: `NEXT_PUBLIC_API_URL`
- Backend DB/Redis envs: `DATABASE_URL`, `REDIS_URL`
- Worker queue: BullMQ (requires Redis)

Further help

- See `CONTRIBUTING.md` for setup, code style, and PR guidance.

License

- Ask the repository owner for license terms.
````
