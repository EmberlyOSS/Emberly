/*
  Warnings:

  - A unique constraint covering the columns `[stripePriceOneTimeId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "stripePriceOneTimeId" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'plan';

-- CreateIndex
CREATE UNIQUE INDEX "Product_stripePriceOneTimeId_key" ON "Product"("stripePriceOneTimeId");
