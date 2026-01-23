
import { PrismaClient } from '@prisma/client';
import { checkForAnomalies } from '../services/anomalyDetection.service';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Anomaly Detection Test Script...');

    try {
        // 1. Get or Create Action Type 'UPDATE'
        let updateAction = await prisma.action_type.findUnique({
            where: { code: 'UPDATE' }
        });

        if (!updateAction) {
            console.log('⚠️ Action type UPDATE not found, creating it...');
            updateAction = await prisma.action_type.create({
                data: { code: 'UPDATE' }
            });
        }

        console.log(`✅ Using Action Type: UPDATE (ID: ${updateAction.id})`);

        // 2. Define test data
        const ENTITY_TYPE = 'TEST_ANOMALY_ENTITY';
        const ENTITY_ID = `TEST_ID_${Date.now()}`; // Unique ID per run
        const ACTION_BY = 'TEST_USER_ANOMALY';
        const ITERATIONS = 12; // Threshold is 10, so 12 should trigger it

        console.log(`Creating ${ITERATIONS} audit logs for ${ENTITY_TYPE}:${ENTITY_ID}...`);

        let lastLogId = 0;

        // 3. Create rapid updates
        for (let i = 0; i < ITERATIONS; i++) {
            const log = await prisma.audit_log.create({
                data: {
                    entity_type: ENTITY_TYPE,
                    entity_id: ENTITY_ID,
                    action_type_id: updateAction.id,
                    action_by: ACTION_BY,
                    action_at: new Date(),
                    version: i + 1,
                    ip_address: '127.0.0.1',
                    new_data: { test: `update_${i}` } as any // Cast to any to avoid strict type check
                }
            });
            lastLogId = log.id;
            // Small delay to ensure timestamp order if needed, but usually not needed for ms precision
            // await new Promise(r => setTimeout(r, 10)); 
        }

        console.log(`✅ Created ${ITERATIONS} logs. Last Log ID: ${lastLogId}`);

        // 4. Trigger Anomaly Detection
        console.log('🔍 Triggering anomaly detection check...');
        const anomalies = await checkForAnomalies(lastLogId);

        // 5. Check results
        if (anomalies.length > 0) {
            console.log('\n🎉 SUCCESS! Anomalies detected:');
            anomalies.forEach(a => {
                console.log(` - Type: ${a.anomalyType}`);
                console.log(` - Severity: ${a.severity}`);
                console.log(` - Context:`, a.contextData);
            });
        } else {
            console.log('\n❌ FAILURE! No anomalies detected. Check thresholds or logic.');
        }

        // 6. Clean up (Optional - maybe keep to inspect in DB)
        // await prisma.audit_log.deleteMany({ where: { entity_type: ENTITY_TYPE } });

    } catch (error) {
        console.error('❌ Error during test:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
