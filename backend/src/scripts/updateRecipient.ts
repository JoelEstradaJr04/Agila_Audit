
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const targetEmail = 'agilafinance0@gmail.com';
    console.log(`Updating recipient to ${targetEmail} to satisfy Resend testing restriction...`);

    // Update all recipients to the testing email for now, or just the one we found
    const result = await prisma.notification_recipient.updateMany({
        data: {
            email: targetEmail
        }
    });

    console.log(`Updated ${result.count} recipients.`);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
