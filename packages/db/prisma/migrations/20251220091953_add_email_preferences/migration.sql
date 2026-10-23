-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailPreferences" JSONB NOT NULL DEFAULT '{"security": true, "account": true, "billing": true, "marketing": false, "productUpdates": true}';
