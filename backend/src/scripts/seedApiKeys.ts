// ============================================================================
// API KEYS SEEDER - INITIALIZE DEFAULT API KEYS
// ============================================================================

import dotenv from 'dotenv';
import prisma from '../prisma/client';
import { hashValue } from '../utils/hash.util';

// Load environment variables
dotenv.config();

// ============================================================================
// DEFAULT API KEYS CONFIGURATION
// ============================================================================

interface SeedApiKey {
  serviceName: string;
  rawKey: string;
  canWrite: boolean;
  canRead: boolean;
}

const defaultApiKeys: SeedApiKey[] = [
  {
    serviceName: 'finance',
    rawKey: process.env.FINANCE_API_KEY || 'FINANCE_DEFAULT_KEY',
    canWrite: true,
    canRead: false,
  },
  {
    serviceName: 'hr',
    rawKey: process.env.HR_API_KEY || 'HR_DEFAULT_KEY',
    canWrite: true,
    canRead: false,
  },
  {
    serviceName: 'inventory',
    rawKey: process.env.INVENTORY_API_KEY || 'INVENTORY_DEFAULT_KEY',
    canWrite: true,
    canRead: false,
  },
  {
    serviceName: 'operations',
    rawKey: process.env.OPERATIONS_API_KEY || 'OPERATIONS_DEFAULT_KEY',
    canWrite: true,
    canRead: false,
  },
  {
    serviceName: 'budget',
    rawKey: process.env.BUDGET_API_KEY || 'BUDGET_DEFAULT_KEY',
    canWrite: true,
    canRead: false,
  },
];

// ============================================================================
// SEEDER FUNCTION
// ============================================================================

async function seedApiKeys() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌱 Seeding API Keys...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    for (const keyConfig of defaultApiKeys) {
      const keyHash = hashValue(keyConfig.rawKey);

      // Check if key already exists
      const existingKey = await prisma.apiKey.findUnique({
        where: { keyHash },
      });

      if (existingKey) {
        console.log(`⏭️  Skipping ${keyConfig.serviceName} - Key already exists`);
        continue;
      }

      // Create new API key
      const apiKey = await prisma.apiKey.create({
        data: {
          keyHash,
          serviceName: keyConfig.serviceName,
          canWrite: keyConfig.canWrite,
          canRead: keyConfig.canRead,
          isActive: true,
          createdBy: 'system',
        },
      });

      console.log(`✅ Created API key for ${keyConfig.serviceName} (ID: ${apiKey.id})`);
      console.log(`   Raw Key: ${keyConfig.rawKey}`);
      console.log(`   Hash: ${keyHash.substring(0, 16)}...`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ API Keys seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Save these raw keys securely!');
    console.log('These keys will be used by other microservices to authenticate.');
  } catch (error) {
    console.error('❌ Error seeding API keys:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// RUN SEEDER
// ============================================================================

if (require.main === module) {
  seedApiKeys()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default seedApiKeys;
