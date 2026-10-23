/*
  Warnings:

  - You are about to drop the column `close_reason` on the `tickets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "close_reason",
ADD COLUMN     "close_msg" TEXT,
ADD COLUMN     "create_msg" TEXT;
