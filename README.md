# MLM Binary Plan Project

Minimal full-stack example implementing a binary MLM plan.

Repository layout

- `backend/` — Node.js + Express API with Prisma
- `frontend/` — Next.js (TypeScript)
- `docker-compose.yml` — Postgres + Redis for development

Quick start (development)

1. Start supporting services:

```bash
docker-compose up -d
```

1. Backend

```powershell
cd backend
Copy-Item .env.example .env
npm install
npx prisma generate
# If you have migrations and want to apply them:
npx prisma migrate dev --name init
npm run dev
```

1. Frontend

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Notes

- Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` to point at the backend (default: `http://localhost:4000`).
- Use `backend/.env.example` and `frontend/.env.example` as starting points for local development.

License

- Check with the repository owner for licensing and usage terms.

# MLM (Example Full-stack App)

This repository contains a full-stack MLM demo application with a Node.js backend (Express/Prisma) and a Next.js frontend.

Quick links

- Backend: `/backend`
- Frontend: `/frontend`
- Dev compose: `docker-compose.yml` (Postgres + Redis)

Quick start (recommended)

1. Start dependent services:

```bash
docker-compose up -d
```

2. Backend

```powershell
cd backend
Copy-Item .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init   # optional if migrations exist
npm run dev
```

3. Frontend

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Development notes

- API base URL is controlled by `NEXT_PUBLIC_API_URL` in the frontend.
- Backend uses `DATABASE_URL` and `REDIS_URL`.

License

- Check `LICENSE` or contact the repo owner. (No license file included by default.)
  MLM Binary Plan Project - Scaffold

This workspace contains a starter implementation of the requested MLM binary plan app.

Backend (Node + Express + Prisma)

- Path: `backend/`
- Run:

```powershell
cd backend
npm install
copy .env.example .env
# set DATABASE_URL and JWT_SECRET in .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

Optional services:

- Redis for job queue (BullMQ): `redis-server` or use Docker `docker run -p 6379:6379 redis`
- Start matching worker: `npm run worker:matching`

Frontend (Next.js + TypeScript)

- Path: `frontend/`
- Run:

```powershell
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```

Progress implemented:

- Auth with JWT access + refresh tokens, register/login/refresh/logout endpoints
- Auth middleware and admin role middleware
- Prisma schema with Users, Products, Wallets, Transactions, refresh tokens, daily counters
- Placement service with Postgres advisory locks for concurrency safety
- Purchase flow with direct bonus crediting and BV propagation
- Commission engine skeleton including matching bonus unit-based payment and per-day cap
- BullMQ job queue + matching worker to process matching payouts asynchronously
- Admin product CRUD API and Cloudinary helper for image uploads
- Frontend pages (Next.js + TypeScript SSR): public pages, admin products list, user dashboard

Next steps (I can implement any, one at a time):

1. Harden matching bonus further (configurable unit size, edge-case handling, tests)
2. Add tests (unit + integration) for placement and commission logic
3. Add file upload endpoints and Cloudinary/S3 wiring on admin product create
4. Add more frontend admin pages (create/edit product) and user UX for purchases
5. Add monitoring, logging, CI/CD pipeline

Tell me which item from the list you want me to implement next (or I'll continue the next item in the prioritized list). Also let me know hosting preference and whether you want OTP/email KYC now.

# MLM Binary Plan Project

This repository contains a starter scaffold for an MLM website with a binary plan.

Structure:

- `backend/` - Node.js + Express backend with Prisma schema
- `frontend/` - Next.js frontend scaffold with TailwindCSS (TypeScript + SSR)

Quick start (backend):

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and `JWT_SECRET`.
2. Install dependencies:

```powershell
cd backend; npm install
```

3. Initialize Prisma and migrate (requires PostgreSQL):

```powershell
cd backend
npx prisma generate
npx prisma db push
node prisma/seed.js
```

4. Run the backend:

```powershell
npm run dev
```

Quick start (frontend):

```powershell
cd frontend; npm install; npm run dev
```

Notes & Next Steps:

- Implement robust placement algorithm and unit tests.
- Harden matching bonus (unit-based pairs, daily cap tracking) and add async job processing (BullMQ + Redis).
- Add authentication middleware, token rotation, and refresh tokens.
- Add input validation and rate limiting per route.
- Add image upload (S3/Cloudinary) and email/OTP flows.

Questions for you:

- Any particular hosting preference for back/front/DB?
- Do you want more strict KYC (document upload) flows now?

# MLM Binary Plan Project

This repository contains a starter scaffold for an MLM website with a binary plan.

Structure:

- `backend/` - Node.js + Express backend with Prisma schema
- `frontend/` - Next.js frontend scaffold with TailwindCSS

Quick start (backend):

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and `JWT_SECRET`.
2. Install dependencies:

```powershell
cd backend; npm install
```

3. Initialize Prisma and migrate (requires PostgreSQL):

```powershell
cd backend
npx prisma generate
npx prisma db push
```

4. Run the backend:

```powershell
npm run dev
```

Quick start (frontend):

```powershell
cd frontend; npm install; npm run dev
```

Notes & Next Steps:

- Implement robust placement algorithm and unit tests.
- Implement commission engine (direct bonus, matching bonus, capping).
- Add authentication middleware and protected routes.
- Add Redis and BullMQ for async payouts and job processing.
- Implement file uploads (Cloudinary / S3) for product images.
- Add email/OTP flows for verification and password reset.

Questions for you:

- Do you want SSR (Next.js) for SEO or purely SPA React?
- Preferred hosting provider for backend and DB (Vercel/Render/Neon/Supabase/AWS)?
- Any specific KYC/verification workflow to include?
