-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "discord" TEXT,
ADD COLUMN     "github" TEXT,
ADD COLUMN     "isProfilePublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "profileBio" TEXT,
ADD COLUMN     "profileVisibility" TEXT NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "twitter" TEXT,
ADD COLUMN     "website" TEXT;
