// ============================================================================
// AUDIT LOGS MICROSERVICE - SERVER ENTRY POINT
// ============================================================================

import dotenv from 'dotenv';
import app from './app';
import prisma from './prisma/client';

import os from 'os';

// Load environment variables
dotenv.config();

// Backend port priority:
// 1. Local development: use BACKEND_PORT (preferred for local dev)
// 2. Railway/production: use PORT (auto-provided by Railway)
// 3. Default fallback: 4001
const PORT = process.env.BACKEND_PORT || process.env.PORT || 4001;
const HOST = process.env.HOST || '0.0.0.0';

// For display purposes, show localhost instead of 0.0.0.0 in development
const DISPLAY_HOST = HOST === '0.0.0.0' ? 'localhost' : HOST;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Get network IP address
function getNetworkIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// ============================================================================
// START SERVER
// ============================================================================

async function startServer() {
  try {
    // Test database connection (silent in production)
    await prisma.$connect();

    // Start listening
    app.listen(Number(PORT), HOST, () => {
      const networkIP = getNetworkIP();
      // Minimal startup message
      console.log(`[BACKEND] Local:    http://${DISPLAY_HOST}:${PORT}`);
      console.log(`[BACKEND] Network:  http://${networkIP}:${PORT}`);
      console.log(`[BACKEND] Env:      .env`);
    });
  } catch (error) {
    console.error('[Audit Service] Failed to start:', error);
    process.exit(1);
  }
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

async function gracefulShutdown(signal: string) {
  console.log(`[Audit Service] ${signal} - shutting down...`);
  
  try {
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Audit Service] Shutdown error:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[Audit Service] Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason) => {
  console.error('[Audit Service] Unhandled Rejection:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// ============================================================================
// START
// ============================================================================

startServer();
