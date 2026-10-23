-- CreateEnum
CREATE TYPE "NexiumSquadInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateTable
CREATE TABLE "NexiumSquadInvite" (
    "id" TEXT NOT NULL,
    "squadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "NexiumSquadInviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NexiumSquadInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NexiumSquadInvite_token_key" ON "NexiumSquadInvite"("token");

-- CreateIndex
CREATE INDEX "NexiumSquadInvite_userId_idx" ON "NexiumSquadInvite"("userId");

-- CreateIndex
CREATE INDEX "NexiumSquadInvite_squadId_idx" ON "NexiumSquadInvite"("squadId");

-- CreateIndex
CREATE INDEX "NexiumSquadInvite_token_idx" ON "NexiumSquadInvite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "NexiumSquadInvite_squadId_userId_key" ON "NexiumSquadInvite"("squadId", "userId");

-- AddForeignKey
ALTER TABLE "NexiumSquadInvite" ADD CONSTRAINT "NexiumSquadInvite_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "NexiumSquad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NexiumSquadInvite" ADD CONSTRAINT "NexiumSquadInvite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NexiumSquadInvite" ADD CONSTRAINT "NexiumSquadInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
