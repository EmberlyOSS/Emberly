-- AlterTable
ALTER TABLE "File" ADD COLUMN     "squadId" TEXT;

-- AlterTable
ALTER TABLE "NexiumSquad" ADD COLUMN     "banner" TEXT,
ADD COLUMN     "discord" TEXT,
ADD COLUMN     "github" TEXT,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "twitter" TEXT,
ADD COLUMN     "website" TEXT;

-- CreateIndex
CREATE INDEX "File_squadId_idx" ON "File"("squadId");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "NexiumSquad"("id") ON DELETE SET NULL ON UPDATE CASCADE;
