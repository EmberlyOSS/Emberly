-- AlterTable
ALTER TABLE "User" ADD COLUMN     "discordNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "discordPreferences" JSONB NOT NULL DEFAULT '{"security": true, "account": false, "billing": true, "marketing": false, "productUpdates": false}',
ADD COLUMN     "discordWebhookUrl" TEXT;
