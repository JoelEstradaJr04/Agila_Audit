# Audit Logs Microservice

Full-stack audit logging system with Next.js frontend and Express backend.

## 🚀 Quick Start

### First Time Setup

```bash
pnpm setup
```

This will:
- Install dependencies
- Generate Prisma client
- Run database migrations
- Seed API keys

### Running the Application

**Run both frontend and backend together:**
```bash
pnpm dev
```

This starts:
- Frontend (Next.js) on [http://localhost:4003](http://localhost:4003)
- Backend (Express API) on [http://localhost:4004](http://localhost:4004)

**Run individually:**
```bash
# Backend only
pnpm backend:dev

# Frontend only
pnpm frontend:dev
```

## 📋 Available Scripts

- `pnpm setup` - First-time setup (install, migrate, seed)
- `pnpm dev` - Run both backend and frontend concurrently
- `pnpm backend:dev` - Run backend API only
- `pnpm frontend:dev` - Run frontend only
- `pnpm build` - Build for production
- `pnpm prisma:studio` - Open Prisma Studio

## 🔧 Configuration

Make sure your `.env` file is configured with:
- Database URLs
- JWT secret
- API keys
- Port configuration (Backend: 4004, Frontend: 4003)

## 📚 Documentation

See the `docs/` folder for detailed documentation:
- [Backend README](docs/BACKEND_README.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Quick Reference](docs/QUICK_REFERENCE.md)
- [How to Run](docs/HOW_TO_RUN.md)

## 🌐 Deployment

### Vercel Deployment (Frontend Only)

This project can be deployed to Vercel for the frontend. See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed instructions.

**Quick steps:**
1. Push to GitHub
2. Import to Vercel
3. Add environment variable: `NEXT_PUBLIC_API_BASE_URL`
4. Deploy backend separately (Railway, Render, etc.)

The backend needs to be deployed to a Node.js hosting service separately.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Vercel Deployment Guide](VERCEL_DEPLOYMENT.md)
