-- AlterTable
ALTER TABLE "CustomDomain" ADD COLUMN     "cfHostnameId" TEXT,
ADD COLUMN     "cfMeta" JSONB,
ADD COLUMN     "cfStatus" TEXT;
