// ============================================================================
// DEDUPLICATION SERVICE - Prevent duplicate audit events
// ============================================================================

import { prisma } from '../prisma/client';

class DedupService {
  /**
   * Check if an event ID has already been processed
   */
  async isDuplicate(eventId: string, sourceService: string): Promise<boolean> {
    if (!eventId) return false;

    try {
      // Check database
      const existing = await prisma.eventDedup.findUnique({
        where: { eventId },
      });

      if (existing) {
        console.log(`[Dedup] Duplicate event detected (DB): ${eventId}`);
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('[Dedup] Error checking duplicate:', error);
      // On error, allow the event (fail open)
      return false;
    }
  }

  /**
   * Mark an event as processed
   */
  async markAsProcessed(eventId: string, sourceService: string): Promise<void> {
    if (!eventId) return;

    try {
      // Store in database
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Keep for 7 days

      await prisma.eventDedup.create({
        data: {
          eventId,
          sourceService,
          expiresAt,
        },
      });

      console.log(`[Dedup] Event marked as processed: ${eventId}`);
    } catch (error: any) {
      console.error('[Dedup] Error marking event as processed:', error);
      // Don't throw - dedup failure shouldn't break audit logging
    }
  }

  /**
   * Clean up expired dedup records (run periodically)
   */
  async cleanupExpired(): Promise<number> {
    try {
      const result = await prisma.eventDedup.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      console.log(`[Dedup] Cleaned up ${result.count} expired dedup records`);
      return result.count;
    } catch (error: any) {
      console.error('[Dedup] Error cleaning up expired records:', error);
      return 0;
    }
  }
}

export default new DedupService();
