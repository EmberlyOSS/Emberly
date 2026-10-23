-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "customDomainsLimit" INTEGER,
ADD COLUMN     "storageQuotaGB" INTEGER,
ADD COLUMN     "uploadSizeCapMB" INTEGER;

-- CreateIndex
CREATE INDEX "Event_status_priority_scheduledAt_idx" ON "Event"("status", "priority", "scheduledAt");

-- CreateIndex
CREATE INDEX "File_visibility_uploadedAt_idx" ON "File"("visibility", "uploadedAt");

-- CreateIndex
CREATE INDEX "File_isOcrProcessed_idx" ON "File"("isOcrProcessed");

-- CreateIndex
CREATE INDEX "Subscription_status_currentPeriodEnd_idx" ON "Subscription"("status", "currentPeriodEnd");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
