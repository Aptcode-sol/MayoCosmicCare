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

A full-stack MLM (Multi-Level Marketing) application with binary tree structure, commission tracking, and admin panel.

## 🏗️ Project Structure

```
MLM/
├── backend/          # Node.js + Express + Prisma
│   ├── prisma/       # Database schema and migrations
│   ├── src/          # Application source code
│   └── ...
└── frontend/         # Next.js + TypeScript + Tailwind CSS
    ├── app/          # Next.js app router pages
    ├── components/   # React components
    └── ...
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Neon PostgreSQL account (free tier available)
- Redis (for job queues)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Neon Database:**
   - Create account at [Neon Console](https://console.neon.tech/)
   - Create a new project
   - Get your connection strings (pooled & direct)

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Neon connection strings:
   ```env
   DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require&pgbouncer=true
   DIRECT_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   JWT_SECRET=your_secret_key_here
   ```

5. **Initialize database:**
   ```bash
   # Generate Prisma Client
   npm run db:generate

   # Create and apply migrations
   npm run db:migrate:dev

   # Seed database with initial data
   npm run seed
   ```

6. **Start Redis (in Docker):**
   ```bash
   docker-compose up -d
   ```

7. **Start backend server:**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:4000`

8. **Start matching worker (in another terminal):**
   ```bash
   npm run worker:matching
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment (if needed):**
   ```bash
   cp .env.local.example .env.local
   ```

4. **Start frontend:**
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:3000`

## 📚 Documentation

- **[QUICKSTART.md](backend/QUICKSTART.md)** - Quick reference guide
- **[NEON_SETUP.md](backend/NEON_SETUP.md)** - Detailed Neon database setup
- **[DATABASE_MIGRATION.md](backend/DATABASE_MIGRATION.md)** - Migration documentation

## 🛠️ Available Scripts (Backend)

```bash
npm run dev              # Start development server
npm run start            # Start production server
npm run seed             # Seed database with initial data
npm run worker:matching  # Start matching bonus worker
npm run monitor          # Monitor queue statistics

# Database
npm run db:generate      # Generate Prisma Client
npm run db:migrate       # Deploy migrations (production)
npm run db:migrate:dev   # Run migrations (development)
npm run db:studio        # Open Prisma Studio GUI
npm run db:push          # Push schema without migrations
npm run db:pull          # Pull schema from database
```

## ✨ Features Implemented

### Authentication & Authorization
- ✅ JWT access + refresh token system
- ✅ Register/Login/Logout endpoints
- ✅ Email verification flow
- ✅ Password reset with token
- ✅ Admin and User role middleware
- ✅ Rate limiting and security headers

### MLM Binary Tree
- ✅ Binary placement algorithm with PostgreSQL advisory locks
- ✅ Sponsor tracking and referral system
- ✅ Left/Right position management
- ✅ Business Volume (BV) propagation up the tree
- ✅ Carry-forward BV tracking

### Commission System
- ✅ Direct bonus on product purchase
- ✅ Matching bonus (pair-based)
- ✅ Daily pair cap enforcement
- ✅ Unit-based BV pairing (7000 BV per pair)
- ✅ BullMQ job queue for async processing
- ✅ Matching worker for payout calculations

### Product Management
- ✅ Admin product CRUD APIs
- ✅ Product listing (public & admin)
- ✅ Stock management
- ✅ Cloudinary integration for image uploads
- ✅ Purchase flow with wallet integration

### Wallet & Transactions
- ✅ User wallet system
- ✅ Transaction history tracking
- ✅ Withdrawal request system
- ✅ Admin approval workflow

### Admin Panel
- ✅ User management (block/unblock)
- ✅ Product management
- ✅ Transaction monitoring
- ✅ Withdrawal approval
- ✅ Queue statistics dashboard

### Frontend (Next.js)
- ✅ Server-side rendering (SSR)
- ✅ Authentication pages (login/register)
- ✅ User dashboard
- ✅ Product catalog
- ✅ Binary tree visualization
- ✅ Admin product management
- ✅ Responsive design with Tailwind CSS

## 🗄️ Database (Neon PostgreSQL)

This project uses **Neon** - a serverless PostgreSQL database with the following benefits:

- ✅ **Serverless**: No database management required
- ✅ **Connection Pooling**: Built-in PgBouncer integration
- ✅ **Auto-scaling**: Scales based on demand
- ✅ **Free Tier**: 512MB storage, perfect for development
- ✅ **High Availability**: Automatic backups and replication

### Schema Highlights

- **Users**: Binary tree structure with sponsor/referral relations
- **Products**: MLM products with BV (Business Volume) points
- **Wallets**: User balance tracking
- **Transactions**: Complete transaction history
- **PairPayoutRecords**: Daily matching bonus records
- **Withdrawals**: Withdrawal request management

## 🔐 Security Features

- Bcrypt password hashing
- JWT token authentication
- CSRF protection with csurf
- Helmet.js security headers
- Express rate limiting
- Input validation with express-validator
- SQL injection protection via Prisma ORM

## 📊 Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: Neon PostgreSQL
- **Queue**: BullMQ + Redis
- **Auth**: JWT (jsonwebtoken)
- **Validation**: express-validator, Zod
- **Image Upload**: Cloudinary

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **UI**: React components

## 🎯 Next Steps

- [ ] Add unit and integration tests
- [ ] Implement advanced tree visualization
- [ ] Add email notifications (NodeMailer/SendGrid)
- [ ] Add OTP verification
- [ ] Implement KYC document upload
- [ ] Add analytics dashboard
- [ ] Set up CI/CD pipeline
- [ ] Add monitoring and logging (Winston)
- [ ] Deploy to production

## 📝 Environment Variables

### Backend (.env)
```env
DATABASE_URL=          # Neon pooled connection
DIRECT_URL=            # Neon direct connection
JWT_SECRET=            # Strong random secret
PORT=4000
REDIS_URL=redis://127.0.0.1:6379
PAIR_UNIT_BV=7000
DAILY_PAIR_CAP=10
CLOUDINARY_URL=        # Cloudinary credentials
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT

## 🆘 Troubleshooting

See [QUICKSTART.md](backend/QUICKSTART.md) for common issues and solutions.

For Neon-specific issues, check [NEON_SETUP.md](backend/NEON_SETUP.md).
