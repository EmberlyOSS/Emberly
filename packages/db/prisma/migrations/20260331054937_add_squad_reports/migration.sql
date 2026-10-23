-- CreateTable
CREATE TABLE "SquadReport" (
    "id" TEXT NOT NULL,
    "squadId" TEXT NOT NULL,
    "reporterUserId" TEXT NOT NULL,
    "category" "ReportCategory" NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "resolution" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SquadReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SquadReport_squadId_idx" ON "SquadReport"("squadId");

-- CreateIndex
CREATE INDEX "SquadReport_status_idx" ON "SquadReport"("status");

-- CreateIndex
CREATE INDEX "SquadReport_createdAt_idx" ON "SquadReport"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SquadReport_squadId_reporterUserId_key" ON "SquadReport"("squadId", "reporterUserId");

-- AddForeignKey
ALTER TABLE "SquadReport" ADD CONSTRAINT "SquadReport_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "NexiumSquad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquadReport" ADD CONSTRAINT "SquadReport_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
