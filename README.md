# Audit Trail System - Monorepo

A full-stack audit logging microservice with Next.js frontend and Express backend.

## 📁 Repository Structure

```
audit/
├── frontend/                 # Next.js Frontend Application
│   ├── app/                 # Next.js app directory (pages, components)
│   ├── public/              # Static assets
│   ├── scripts/             # Frontend scripts
│   ├── package.json         # Frontend dependencies
│   ├── tsconfig.json        # Frontend TypeScript config
│   ├── next.config.ts       # Next.js configuration
│   └── .env                 # Frontend environment variables
│
├── backend/                 # Express Backend API
│   ├── src/                 # Source code
│   │   ├── controllers/     # Route controllers
│   │   ├── services/        # Business logic
│   │   ├── middlewares/     # Express middlewares
│   │   ├── routes/          # API routes
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions
│   │   ├── prisma/          # Prisma client
│   │   ├── app.ts           # Express app configuration
│   │   └── index.ts         # Server entry point
│   ├── prisma/              # Database schema and migrations
│   ├── package.json         # Backend dependencies
│   ├── tsconfig.json        # Backend TypeScript config
│   └── .env                 # Backend environment variables
│
├── docs/                    # Documentation
├── package.json             # Root orchestration scripts
├── pnpm-workspace.yaml      # PNPM workspace configuration
├── vercel.json              # Vercel deployment config (frontend)
└── railway.json             # Railway deployment config (backend)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm 10+
- PostgreSQL database

### Development Setup

1. **Install all dependencies:**
   ```bash
   pnpm install:all
   ```

2. **Configure environment variables:**
   ```bash
   # Frontend
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env with your settings

   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database URL and secrets
   ```

3. **Setup database:**
   ```bash
   cd backend
   pnpm prisma:generate
   pnpm prisma:migrate
   pnpm seed:apikeys
   ```

4. **Run both applications:**
   ```bash
   # From root directory
   pnpm dev
   ```

   Or run individually:
   ```bash
   # Frontend only (http://localhost:4000)
   pnpm dev:frontend

   # Backend only (http://localhost:5000)
   pnpm dev:backend
   ```

## 📦 Available Scripts

### Root Level
- `pnpm dev` - Run both frontend and backend concurrently
- `pnpm dev:frontend` - Run frontend only
- `pnpm dev:backend` - Run backend only
- `pnpm install:all` - Install all dependencies
- `pnpm setup` - Complete setup (install + database + seeds)

### Frontend (cd frontend)
- `pnpm dev` - Start Next.js dev server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Backend (cd backend)
- `pnpm dev` - Start Express dev server with hot reload
- `pnpm build` - Compile TypeScript to dist/
- `pnpm start` - Run compiled production server
- `pnpm prisma:generate` - Generate Prisma client
- `pnpm prisma:migrate` - Run database migrations
- `pnpm prisma:studio` - Open Prisma Studio GUI
- `pnpm seed:apikeys` - Seed API keys
- `pnpm seed:actions` - Seed action types
- `pnpm seed:auditlogs` - Seed sample audit logs

## 🌐 Deployment

### Frontend (Vercel)

1. **Connect Repository:**
   - Import `JoelEstradaJr04/Agila_Audit` to Vercel
   - Vercel will auto-detect Next.js

2. **Configure:**
   - Root Directory: `frontend`
   - Framework Preset: Next.js
   - Build Command: `pnpm install && pnpm build`
   - Install Command: `pnpm install`

3. **Environment Variables:**
   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_BASE_URL=https://your-backend.railway.app
   ```

4. **Deploy:** Push to `master` branch

### Backend (Railway)

1. **Create New Project:**
   - Deploy from GitHub: `JoelEstradaJr04/Agila_Audit`
   - Add PostgreSQL database service

2. **Configure:**
   - Root Directory: `backend`
   - Build Command: `pnpm install && pnpm prisma:generate && pnpm build`
   - Start Command: `pnpm prisma:migrate:prod && pnpm start`

3. **Environment Variables:**
   ```
   NODE_ENV=production
   AUDIT_LOGS_DATABASE_URL=${{Postgres.DATABASE_URL}}
   CORS_ORIGIN=https://your-frontend.vercel.app
   JWT_SECRET=your-production-secret
   # Add all other env vars from backend/.env.production.example
   ```

4. **Generate Domain:** Settings → Networking → Generate Domain

5. **Update Frontend:** Add Railway backend URL to Vercel env vars

## 🔒 Environment Variables

### Frontend (.env)
- `PORT` - Frontend port (default: 4000)
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL

### Backend (.env)
- `BACKEND_PORT` / `PORT` - Backend port (default: 5000)
- `AUDIT_LOGS_DATABASE_URL` - PostgreSQL connection string
- `CORS_ORIGIN` - Allowed frontend origins
- `JWT_SECRET` - Secret for JWT verification
- `DISABLE_AUTH` - Set to `true` for local testing only
- Service API keys (FINANCE_API_KEY, HR_API_KEY, etc.)

## 🏗️ Architecture

**Frontend (Next.js 16)**
- React 19 with Server Components
- TypeScript with strict mode
- TailwindCSS for styling
- SweetAlert2 for notifications

**Backend (Express + TypeScript)**
- RESTful API with Express.js
- Prisma ORM for database
- JWT authentication
- Role-based access control
- Rate limiting & security headers

**Database (PostgreSQL)**
- Audit logs with versioning
- Action types tracking
- API key management

## 📝 Migration Notes

This project was refactored from a mixed single-repo structure to a clean monorepo with separated frontend and backend folders.

### Changes Made:
- ✅ Moved all Next.js files to `frontend/`
- ✅ Moved all Express files to `backend/`
- ✅ Split `package.json` into three (root + frontend + backend)
- ✅ Split `tsconfig.json` for each app
- ✅ Separated environment variables
- ✅ Updated deployment configs (vercel.json, railway.json)
- ✅ Created pnpm workspace configuration
- ✅ All imports and paths updated

### No Logic Changes:
- ✅ No application behavior changes
- ✅ No refactoring of business logic
- ✅ Same authentication/authorization system
- ✅ Same API endpoints and contracts

## 📚 Documentation

See `docs/` folder for:
- API Documentation
- Authentication Guide
- Testing Guide
- Deployment Checklist

## 🤝 Contributing

1. Ensure both apps run: `pnpm dev`
2. Follow existing code structure
3. Update relevant documentation
4. Test both frontend and backend

## 📄 License

Private project for Capstone Audit System
