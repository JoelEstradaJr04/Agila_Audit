# Migration Guide - Monorepo Restructure

## 📋 Overview

This project has been refactored from a mixed single-repository structure to a clean monorepo with separated **frontend** and **backend** directories.

## 🎯 What Changed

### Directory Structure

**BEFORE:**
```
audit/
├── app/              # Next.js app
├── src/              # Express backend
├── prisma/           # Database
├── public/           # Static files
├── package.json      # Mixed dependencies
└── tsconfig.json     # Mixed TypeScript config
```

**AFTER:**
```
audit/
├── frontend/         # Complete Next.js app
│   ├── app/
│   ├── public/
│   ├── package.json  # Frontend only
│   └── tsconfig.json # Frontend only
├── backend/          # Complete Express app
│   ├── src/
│   ├── prisma/
│   ├── package.json  # Backend only
│   └── tsconfig.json # Backend only
└── package.json      # Root orchestration
```

### Files Moved

#### To `/frontend`:
- ✅ `app/` → `frontend/app/`
- ✅ `public/` → `frontend/public/`
- ✅ `next.config.ts` → `frontend/next.config.ts`
- ✅ `next-env.d.ts` → `frontend/next-env.d.ts`
- ✅ `postcss.config.mjs` → `frontend/postcss.config.mjs`
- ✅ `eslint.config.mjs` → `frontend/eslint.config.mjs`
- ✅ `global.d.ts` → `frontend/global.d.ts`
- ✅ `scripts/start-frontend.js` → `frontend/scripts/start-frontend.js`

#### To `/backend`:
- ✅ `src/` → `backend/src/`
- ✅ `prisma/` → `backend/prisma/`

#### Created:
- ✅ `frontend/package.json` (Next.js dependencies only)
- ✅ `backend/package.json` (Express dependencies only)
- ✅ `frontend/tsconfig.json` (Next.js TypeScript config)
- ✅ `backend/tsconfig.json` (Express TypeScript config)
- ✅ `frontend/.env` (Frontend environment variables)
- ✅ `backend/.env` (Backend environment variables)
- ✅ `pnpm-workspace.yaml` (PNPM monorepo config)
- ✅ Root `package.json` (Orchestration scripts)

#### Updated:
- ✅ `vercel.json` (Points to frontend/ directory)
- ✅ `railway.json` (Points to backend/ directory)
- ✅ `README.md` (Complete new documentation)

#### Removed:
- ❌ Root `.env` (split into frontend/.env and backend/.env)
- ❌ Root `tsconfig.server.json` (merged into backend/tsconfig.json)
- ❌ Old mixed dependencies

## 🔧 Configuration Changes

### package.json Scripts

**OLD:**
```json
{
  "scripts": {
    "dev": "concurrently \"pnpm backend:dev\" \"pnpm frontend:dev\"",
    "backend:dev": "ts-node-dev src/index.ts",
    "frontend:dev": "node scripts/start-frontend.js"
  }
}
```

**NEW Root:**
```json
{
  "scripts": {
    "dev": "concurrently \"pnpm dev:backend\" \"pnpm dev:frontend\"",
    "dev:frontend": "cd frontend && pnpm dev",
    "dev:backend": "cd backend && pnpm dev"
  }
}
```

**NEW Frontend (frontend/package.json):**
```json
{
  "scripts": {
    "dev": "node scripts/start-frontend.js",
    "build": "next build",
    "start": "next start"
  }
}
```

**NEW Backend (backend/package.json):**
```json
{
  "scripts": {
    "dev": "ts-node-dev src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:generate": "npx prisma generate"
  }
}
```

### Environment Variables

**OLD:** Single `.env` file at root

**NEW:** 
- `frontend/.env` - Only frontend configs (PORT, NEXT_PUBLIC_API_BASE_URL)
- `backend/.env` - Only backend configs (BACKEND_PORT, DATABASE_URL, JWT_SECRET, etc.)

### TypeScript Configuration

**OLD:** 
- `tsconfig.json` (Next.js)
- `tsconfig.server.json` (Express)

**NEW:**
- `frontend/tsconfig.json` (Next.js only)
- `backend/tsconfig.json` (Express only)
- Root `tsconfig.json` removed (no longer needed)

## 🚀 How to Use After Migration

### First Time Setup

```bash
# 1. Install all dependencies
pnpm install:all

# 2. Configure environment variables
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
# Edit both .env files

# 3. Setup database
cd backend
pnpm prisma:generate
pnpm prisma:migrate
pnpm seed:apikeys
cd ..

# 4. Run both apps
pnpm dev
```

### Daily Development

```bash
# Run both apps (from root)
pnpm dev

# Or run individually
pnpm dev:frontend  # Frontend only on http://localhost:4000
pnpm dev:backend   # Backend only on http://localhost:5000
```

### Working on Frontend Only

```bash
cd frontend
pnpm dev
# Make changes, hot reload works
pnpm build      # Test production build
```

### Working on Backend Only

```bash
cd backend
pnpm dev
# Make changes, hot reload works
pnpm build      # Compile TypeScript
pnpm prisma:studio  # Open database GUI
```

## 📦 Deployment Changes

### Vercel (Frontend)

**OLD Configuration:**
- Root directory: `/`
- Build command: `pnpm build`

**NEW Configuration:**
- Root directory: `frontend/`
- Build command: `pnpm install && pnpm build`
- Install command: `pnpm install`
- Output directory: `.next`

**Environment Variables:** Add to Vercel:
```
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://your-backend.railway.app
```

### Railway (Backend)

**OLD Configuration:**
- Root directory: `/`
- Build: `pnpm prisma:generate && pnpm backend:build`
- Start: `pnpm backend:start`

**NEW Configuration:**
- Root directory: `backend/`
- Build: `pnpm install && pnpm prisma:generate && pnpm build`
- Start: `pnpm prisma:migrate:prod && pnpm start`

**Environment Variables:** Add to Railway (see `backend/.env.production.example`)

## ✅ What Didn't Change

### No Logic Changes
- ✅ All API endpoints work the same
- ✅ Same authentication/authorization system
- ✅ Same database schema
- ✅ Same UI components and pages
- ✅ Same business logic in controllers/services
- ✅ Same middleware behavior

### No Breaking Changes
- ✅ API contracts unchanged
- ✅ Database migrations unchanged
- ✅ Import paths using `@/` aliases still work
- ✅ Environment variable names same (just in different files)
- ✅ All features work identically

## 🔍 Verification Steps

After migration, verify:

1. **Dependencies installed:**
   ```bash
   ls frontend/node_modules
   ls backend/node_modules
   ```

2. **Both apps start:**
   ```bash
   pnpm dev
   # Should see BACKEND and FRONTEND running
   ```

3. **Frontend loads:** http://localhost:4000
4. **Backend responds:** http://localhost:5000/health
5. **Database connects:** Check backend startup logs
6. **API calls work:** Test audit logs page

## 🐛 Troubleshooting

### "Module not found" errors

**Cause:** Dependencies not installed in subdirectories

**Fix:**
```bash
pnpm install:all
```

### "Cannot find prisma client"

**Cause:** Prisma client not generated in backend

**Fix:**
```bash
cd backend
pnpm prisma:generate
```

### "Connection refused" on API calls

**Cause:** Backend not running or wrong URL

**Fix:**
1. Check `backend/.env` has correct `BACKEND_PORT`
2. Check `frontend/.env` has `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000`
3. Ensure backend is running: `pnpm dev:backend`

### Port conflicts

**Cause:** Ports 4000 or 5000 already in use

**Fix:**
1. Change `PORT` in `frontend/.env`
2. Change `BACKEND_PORT` in `backend/.env`
3. Update `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env` to match new backend port

### CORS errors

**Cause:** Backend CORS_ORIGIN doesn't match frontend URL

**Fix:**
```bash
# In backend/.env
CORS_ORIGIN=http://localhost:4000
```

## 📝 Summary

| Aspect | Before | After |
|--------|--------|-------|
| Structure | Mixed single repo | Clean monorepo |
| package.json | 1 file | 3 files (root + 2 apps) |
| tsconfig.json | 2 files | 2 files (1 per app) |
| .env | 1 file | 2 files (1 per app) |
| Deployments | Complex config | Clear separation |
| Development | Run from root | Run from root or individually |
| Dependencies | Mixed | Cleanly separated |

## 🎉 Benefits

1. **Clear Separation:** Frontend and backend are completely independent
2. **Easier Deployment:** Each app has its own config
3. **Better Isolation:** Dependencies don't conflict
4. **Scalability:** Easy to add more services/apps
5. **Maintainability:** Clear ownership and boundaries
6. **Production Ready:** Follows industry best practices

---

**Need Help?** See `README.md` for full documentation or check `docs/` folder for specific guides.
