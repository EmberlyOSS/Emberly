/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Testimonial` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Testimonial" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Testimonial_userId_key" ON "Testimonial"("userId");
