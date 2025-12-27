-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "action" TEXT,
ADD COLUMN     "actorEmail" TEXT,
ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "geo" JSONB,
ADD COLUMN     "ip" TEXT,
ADD COLUMN     "isAuditable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resource" TEXT,
ADD COLUMN     "success" BOOLEAN,
ADD COLUMN     "targetEmail" TEXT,
ADD COLUMN     "targetId" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- CreateIndex
CREATE INDEX "Event_isAuditable_idx" ON "Event"("isAuditable");

-- CreateIndex
CREATE INDEX "Event_actorId_idx" ON "Event"("actorId");

-- CreateIndex
CREATE INDEX "Event_actorId_createdAt_idx" ON "Event"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "Event_isAuditable_createdAt_idx" ON "Event"("isAuditable", "createdAt");
