-- CreateEnum
CREATE TYPE "DocCategory" AS ENUM ('MAIN', 'USERS', 'HOSTING');

-- CreateEnum
CREATE TYPE "DocStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "DocPage" (
    "id" TEXT NOT NULL,
    "category" "DocCategory" NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "status" "DocStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "sortOrder" INTEGER,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocPage_category_status_publishedAt_idx" ON "DocPage"("category", "status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocPage_category_slug_key" ON "DocPage"("category", "slug");

-- AddForeignKey
ALTER TABLE "DocPage" ADD CONSTRAINT "DocPage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
