
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Checking Notification Recipients...');
    const recipients = await prisma.notification_recipient.findMany();
    console.log('Recipients found:', recipients);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
