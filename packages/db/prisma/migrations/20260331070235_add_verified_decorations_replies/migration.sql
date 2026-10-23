-- AlterTable
ALTER TABLE "NexiumSquad" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarDecoration" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ApplicationReply" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isStaffReply" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationReply_applicationId_idx" ON "ApplicationReply"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationReply_userId_idx" ON "ApplicationReply"("userId");

-- AddForeignKey
ALTER TABLE "ApplicationReply" ADD CONSTRAINT "ApplicationReply_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationReply" ADD CONSTRAINT "ApplicationReply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
