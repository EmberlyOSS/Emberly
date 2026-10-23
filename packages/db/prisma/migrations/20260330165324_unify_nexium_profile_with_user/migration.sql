/*
  Warnings:

  - You are about to drop the column `handle` on the `NexiumProfile` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "NexiumProfile_handle_idx";

-- DropIndex
DROP INDEX "NexiumProfile_handle_key";

-- AlterTable
ALTER TABLE "CustomDomain" ADD COLUMN     "squadId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "NexiumProfile" DROP COLUMN "handle";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "showLinkedAccounts" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "CustomDomain_squadId_idx" ON "CustomDomain"("squadId");

-- AddForeignKey
ALTER TABLE "CustomDomain" ADD CONSTRAINT "CustomDomain_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "NexiumSquad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
