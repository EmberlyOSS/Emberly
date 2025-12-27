-- CreateEnum
CREATE TYPE "FileCollaboratorRole" AS ENUM ('EDITOR', 'SUGGESTER');

-- CreateEnum
CREATE TYPE "FileEditSuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "allowSuggestions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "FileCollaborator" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "FileCollaboratorRole" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileEditSuggestion" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "message" TEXT,
    "status" "FileEditSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "FileEditSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FileCollaborator_fileId_idx" ON "FileCollaborator"("fileId");

-- CreateIndex
CREATE INDEX "FileCollaborator_userId_idx" ON "FileCollaborator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FileCollaborator_fileId_userId_key" ON "FileCollaborator"("fileId", "userId");

-- CreateIndex
CREATE INDEX "FileEditSuggestion_fileId_idx" ON "FileEditSuggestion"("fileId");

-- CreateIndex
CREATE INDEX "FileEditSuggestion_userId_idx" ON "FileEditSuggestion"("userId");

-- CreateIndex
CREATE INDEX "FileEditSuggestion_status_idx" ON "FileEditSuggestion"("status");

-- AddForeignKey
ALTER TABLE "FileCollaborator" ADD CONSTRAINT "FileCollaborator_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileCollaborator" ADD CONSTRAINT "FileCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileEditSuggestion" ADD CONSTRAINT "FileEditSuggestion_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileEditSuggestion" ADD CONSTRAINT "FileEditSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileEditSuggestion" ADD CONSTRAINT "FileEditSuggestion_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
