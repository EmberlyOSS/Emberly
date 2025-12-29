/*
  Warnings:

  - A unique constraint covering the columns `[stripePriceMonthlyId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripePriceYearlyId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "stripePriceMonthlyId" TEXT,
ADD COLUMN     "stripePriceYearlyId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_stripePriceMonthlyId_key" ON "Product"("stripePriceMonthlyId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_stripePriceYearlyId_key" ON "Product"("stripePriceYearlyId");
