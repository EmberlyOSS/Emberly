-- AlterTable
ALTER TABLE "User" ADD COLUMN     "grants" TEXT[] DEFAULT ARRAY[]::TEXT[];
