-- AlterTable
ALTER TABLE "User" ADD COLUMN     "magicLinkExpires" TIMESTAMP(3),
ADD COLUMN     "magicLinkToken" TEXT;
