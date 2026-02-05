// Prisma 7 Configuration
// ============================================================================
// Database connection URL moved from schema.prisma to this config file
// See: https://pris.ly/d/config-datasource

export default {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};
