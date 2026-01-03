-- AlterTable
ALTER TABLE "audit_log" ADD COLUMN     "ip_address" TEXT;

-- CreateIndex
CREATE INDEX "audit_log_ip_address_idx" ON "audit_log"("ip_address");
