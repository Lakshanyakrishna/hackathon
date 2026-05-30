# Deployment Guide

## Prerequisites

- **Node.js** >= 18
- **PostgreSQL** >= 14
- **Razorpay** merchant account (for payments)
- **SMTP** provider (for emails, optional)

## Required Environment Variables

### Backend (`.env` in `backend/`)

```env
# Database (required)
DATABASE_URL=postgresql://user:password@host:5432/hackhub

# JWT (required)
JWT_SECRET=<random-64-char-string>
JWT_EXPIRES_IN=7d

# Razorpay (required for payments)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxx

# App (required)
PORT=3001
FRONTEND_URL=https://yourfrontend.com
NODE_ENV=production
```

### Frontend (`.env` in `frontend/`)

```env
# API URL — set to full backend URL for cross-origin (Vercel → Railway)
# If frontend is served from same domain as backend, omit this (uses relative /api/v1)
VITE_API_URL=https://api.yourbackend.com/api/v1

# Razorpay Key ID (required)
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxx
```

## Deployment Steps

### 1. Database

```bash
cd backend
npx prisma db push
```

> **Note:** This project uses `prisma db push` (no migration files). `prisma migrate deploy` will not work. Use `prisma db push` to sync the schema.

### 2. Backend (Railway)

- **Root directory:** `backend`
- **Build command:** `npm ci && npm run build && npx prisma generate`
- **Start command:** `node dist/main`
- **Railway build command:** `npm ci && npm run build && npx prisma generate`
- **Railway start command:** `node dist/main`

Add PostgreSQL plugin and all environment variables above.

### 3. Frontend (Vercel)

- **Root directory:** `frontend`
- **Vercel build command:** `npm ci && npm run build`
- **Vercel output directory:** `dist`
- **Environment variables:** `VITE_API_URL`, `VITE_RAZORPAY_KEY_ID`
- **Rewrite rule:** `/*` → `/index.html` (SPA fallback)

## Health Check

After deployment, verify:

```bash
curl https://api.yourbackend.com/health
# → { "status": "ok", "timestamp": "...", "uptime": 123 }
```

## Razorpay Webhook

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://api.yourbackend.com/api/v1/payments/webhook`
3. Select events: `payment.captured`, `payment.failed`, `refund.created`
4. Set webhook secret matching `RAZORPAY_WEBHOOK_SECRET`

## Known Gaps

| Item | Status | Notes |
|------|--------|-------|
| Health endpoint | ✅ Added | `GET /health` returns status, timestamp, uptime |
| CORS | ✅ Configurable | Uses `FRONTEND_URL` env var |
| Prisma migrations | ⚠️ `db push` only | No migration files; use `db push` for schema sync |
| Email service | ❌ Not implemented | Password reset logs to console only; no SMTP integration |
| Production logging | ⚠️ Basic | Uses NestJS default Logger; no structured JSON logging |
| Frontend API_BASE | ✅ Configurable | VITE_API_URL env var or falls back to `/api/v1` |

## Production Recommendations

1. Add structured JSON logging (`pino` + `nestjs-pino`)
2. Implement email service (`nodemailer` or SendGrid/Mailgun)
3. Create Prisma migration files before production DB changes
4. Set up database backups
5. Add monitoring (Sentry for errors, PM2 for process management)
6. Rate limiting is already enabled via `@nestjs/throttler` (100 req/min)

## Monitoring

- Backend logs: Railway dashboard or PM2
- Database: Railway PostgreSQL dashboard
- Payments: Razorpay dashboard
- Errors: Integrate Sentry
