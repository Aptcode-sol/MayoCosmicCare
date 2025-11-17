# MLM Platform Deployment Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Git for version control

## Backend Setup

### 1. Environment Configuration

Create `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mlm"
JWT_SECRET="your-secure-jwt-secret-here"
PORT=5000

# Commission Configuration
DIRECT_BONUS_AMOUNT=500
PAIR_UNIT_BV=100
MATCHING_PERCENT=10
DAILY_PAIR_CAP=3
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Database Setup

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Start Backend

```bash
npm run dev
```

Backend runs on `http://localhost:5000`

## Frontend Setup

### 1. Environment Configuration

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Start Frontend

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

## Production Deployment

### Backend (Railway/Render/DigitalOcean)

1. Set environment variables in hosting platform
2. Connect PostgreSQL database
3. Run migrations: `npx prisma migrate deploy`
4. Start with: `npm start`

### Frontend (Vercel/Netlify)

1. Connect GitHub repository
2. Set `NEXT_PUBLIC_API_URL` to backend URL
3. Build command: `npm run build`
4. Deploy automatically on push

## Features Implemented

### UI/UX

- ✅ Professional black theme (#0a0a0a background)
- ✅ Responsive Header with UserAvatar dropdown
- ✅ Hero landing page with stats and features
- ✅ Modern auth pages (login/register)
- ✅ Professional products page with grid layout
- ✅ Comprehensive dashboard with stats cards
- ✅ Gradient buttons and glass-card effects
- ✅ Smooth transitions and hover effects

### Backend

- ✅ Binary tree MLM structure (adjacency-list)
- ✅ Transaction-safe commission service with advisory locks
- ✅ Direct bonus and matching bonus system
- ✅ Atomic wallet operations
- ✅ Configurable commission parameters
- ✅ JWT authentication
- ✅ Role-based access control

### Accessibility

- ✅ ARIA listbox/option roles for sponsor autocomplete
- ✅ Keyboard navigation support
- ✅ Focus management and screen reader support

## Testing Checklist

- [ ] Register new user with sponsor
- [ ] Login and verify dashboard stats
- [ ] Purchase products and check BV calculation
- [ ] Verify commission payouts (direct + matching)
- [ ] Test responsive design on mobile
- [ ] Check all navigation links
- [ ] Verify logout functionality
- [ ] Test referral link copy feature

## Support

For issues or questions, check the codebase documentation or contact the development team.
