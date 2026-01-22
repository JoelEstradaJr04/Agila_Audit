import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed Audit Logs with sample data (50+ records)
 * This creates realistic audit log entries for testing and development
 */
async function seedAuditLogs() {
  console.log('🌱 Seeding audit logs...');

  // Delete existing audit logs first to avoid duplicates
  const deleteResult = await prisma.audit_log.deleteMany({});
  console.log(`🗑️  Deleted ${deleteResult.count} existing audit log records`);

  // First, ensure action types exist
  const actionTypes = await prisma.action_type.findMany();
  if (actionTypes.length === 0) {
    console.log('❌ No action types found. Please run: pnpm seed:actions first');
    return;
  }

  console.log(`✅ Found ${actionTypes.length} action types`);

  // Get specific action types by code
  const createAction = actionTypes.find(at => at.code === 'CREATE');
  const updateAction = actionTypes.find(at => at.code === 'UPDATE');
  const deleteAction = actionTypes.find(at => at.code === 'DELETE');
  const exportAction = actionTypes.find(at => at.code === 'EXPORT');
  const loginAction = actionTypes.find(at => at.code === 'LOGIN');
  const logoutAction = actionTypes.find(at => at.code === 'LOGOUT');
  const archiveAction = actionTypes.find(at => at.code === 'ARCHIVE');
  const unarchiveAction = actionTypes.find(at => at.code === 'UNARCHIVE');

  // Filter only available actions
  const availableActions = [createAction, updateAction, deleteAction, exportAction, loginAction, logoutAction, archiveAction, unarchiveAction].filter(Boolean);
  
  if (availableActions.length === 0) {
    console.log('❌ No valid action types found');
    return;
  }

  console.log(`✅ Using ${availableActions.length} action types: ${availableActions.map(a => a?.code).join(', ')}`);

  // Create one record for each action type
  const auditLogs: Prisma.audit_logCreateInput[] = [];
  const baseDate = new Date('2026-01-05T10:00:00Z');

  // 1. CREATE action - Uses new_data only, version=1
  if (createAction) {
    auditLogs.push({
      entity_type: 'ExpenseRecord',
      entity_id: 'EXP-1001',
      action_type: { connect: { id: createAction.id } },
      action_by: 'john.doe@company.com',
      action_from: 'Finance',
      action_at: new Date(baseDate.getTime()),
      // previous_data omitted - CREATE never uses it
      new_data: {
        amount: 1500,
        status: 'pending',
        description: 'New expense record created',
        category: 'Travel',
        date: '2026-01-05'
      },
      version: 1, // CREATE always starts at version 1
      ip_address: '192.168.1.100'
    });
  }

  // 2. UPDATE action - Uses both previous_data and new_data, version increments
  if (updateAction) {
    auditLogs.push({
      entity_type: 'ExpenseRecord',
      entity_id: 'EXP-1001', // Same entity as CREATE to show version increment
      action_type: { connect: { id: updateAction.id } },
      action_by: 'jane.smith@company.com',
      action_from: 'Finance',
      action_at: new Date(baseDate.getTime() + 3600000), // +1 hour
      previous_data: {
        amount: 1500,
        status: 'pending',
        approvedBy: null
      },
      new_data: {
        amount: 1800,
        status: 'approved',
        approvedBy: 'jane.smith@company.com'
      },
      version: 2, // UPDATE increments version (previous CREATE was version 1)
      ip_address: '192.168.1.101'
    });
  }

  // 3. DELETE action - Requires previous_data (what was deleted)
  if (deleteAction) {
    auditLogs.push({
      entity_type: 'ExpenseRecord',
      entity_id: 'EXP-1002',
      action_type: { connect: { id: deleteAction.id } },
      action_by: 'admin@company.com',
      action_from: 'Operations',
      action_at: new Date(baseDate.getTime() + 7200000), // +2 hours
      previous_data: {
        amount: 2500,
        status: 'rejected',
        description: 'Duplicate expense entry',
        category: 'Travel',
        rejectedBy: 'admin@company.com',
        rejectionReason: 'Duplicate submission'
      },
      // new_data omitted - DELETE doesn't use new_data
      version: 1,
      ip_address: '192.168.1.102'
    });
  }

  // 4. EXPORT action - No data changes tracked, entity_id is reference
  if (exportAction) {
    auditLogs.push({
      entity_type: 'AuditLog',
      entity_id: 'EXPORT-20260105-001',
      action_type: { connect: { id: exportAction.id } },
      action_by: 'finance.manager@company.com',
      action_from: 'Finance',
      action_at: new Date(baseDate.getTime() + 10800000), // +3 hours
      // previous_data and new_data omitted - EXPORT doesn't track data changes
      version: 1,
      ip_address: '192.168.1.103'
    });
  }

  // 5. IMPORT action - No data changes tracked, entity_id is reference
  const importAction = actionTypes.find(at => at.code === 'IMPORT');
  if (importAction) {
    auditLogs.push({
      entity_type: 'ExpenseRecord',
      entity_id: 'IMPORT-20260105-001',
      action_type: { connect: { id: importAction.id } },
      action_by: 'system',
      action_from: 'Operations',
      action_at: new Date(baseDate.getTime() + 14400000), // +4 hours
      // previous_data and new_data omitted - IMPORT doesn't track data changes
      version: 1,
      ip_address: '10.0.0.25'
    });
  }

  // 6. LOGIN action - No data changes tracked
  if (loginAction) {
    auditLogs.push({
      entity_type: 'UserSession',
      entity_id: 'SESSION-john.doe-1735988400000',
      action_type: { connect: { id: loginAction.id } },
      action_by: 'john.doe@company.com',
      action_from: 'Human Resources',
      action_at: new Date(baseDate.getTime() + 18000000), // +5 hours
      // previous_data and new_data omitted - LOGIN doesn't track data changes
      version: 1,
      ip_address: '192.168.1.50'
    });
  }

  // 7. LOGOUT action - No data changes tracked
  if (logoutAction) {
    auditLogs.push({
      entity_type: 'UserSession',
      entity_id: 'SESSION-john.doe-1735988400000',
      action_type: { connect: { id: logoutAction.id } },
      action_by: 'john.doe@company.com',
      action_from: 'Human Resources',
      action_at: new Date(baseDate.getTime() + 36000000), // +10 hours
      // previous_data and new_data omitted - LOGOUT doesn't track data changes
      version: 2, // Version 2 since it's a follow-up action on the same session
      ip_address: '192.168.1.50'
    });
  }

  // 8. ARCHIVE action - Uses new_data for new status
  if (archiveAction) {
    auditLogs.push({
      entity_type: 'ExpenseRecord',
      entity_id: 'EXP-1003',
      action_type: { connect: { id: archiveAction.id } },
      action_by: 'finance.manager@company.com',
      action_from: 'Inventory',
      action_at: new Date(baseDate.getTime() + 21600000), // +6 hours
      new_data: {
        status: 'archived',
        archivedBy: 'finance.manager@company.com',
        archivedAt: '2026-01-05T16:00:00Z',
        reason: 'End of fiscal year archival'
      },
      // previous_data omitted - ARCHIVE doesn't use previous_data
      version: 1,
      ip_address: '192.168.1.104'
    });
  }

  // 9. UNARCHIVE action - Uses new_data for new status
  if (unarchiveAction) {
    auditLogs.push({
      entity_type: 'ExpenseRecord',
      entity_id: 'EXP-1003',
      action_type: { connect: { id: unarchiveAction.id } },
      action_by: 'finance.manager@company.com',
      action_from: 'Inventory',
      action_at: new Date(baseDate.getTime() + 25200000), // +7 hours
      new_data: {
        status: 'active',
        unarchivedBy: 'finance.manager@company.com',
        unarchivedAt: '2026-01-05T17:00:00Z',
        reason: 'Record needed for audit review'
      },
      // previous_data omitted - UNARCHIVE doesn't use previous_data
      version: 2, // Version 2 since it's following the ARCHIVE action
      ip_address: '192.168.1.104'
    });
  }

  // Insert all audit logs
  console.log(`📝 Creating ${auditLogs.length} audit log records (one per action type)...`);
  let successCount = 0;

  for (const log of auditLogs) {
    try {
      await prisma.audit_log.create({
        data: log
      });
      successCount++;
      console.log(`   ✓ Created ${successCount}/${auditLogs.length} records...`);
    } catch (error) {
      console.error(`❌ Error creating audit log:`, error);
    }
  }

  console.log(`✨ Audit logs seeding completed! Created ${successCount}/${auditLogs.length} records.`);
}

async function main() {
  try {
    await seedAuditLogs();
  } catch (error) {
    console.error('❌ Error seeding audit logs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
