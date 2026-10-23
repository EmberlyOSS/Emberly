-- Baseline schema for the Emberly status page

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMINISTRATOR', 'BASE_USER');

-- CreateEnum
CREATE TYPE "ComponentStatus" AS ENUM ('OPERATIONAL', 'DEGRADED_PERFORMANCE', 'PARTIAL_OUTAGE', 'MAJOR_OUTAGE', 'UNDER_MAINTENANCE');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('NOT_STARTED_YET', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "HomePageDisplay" AS ENUM ('COMPONENTS', 'RESPONSE_TIMES', 'BOTH');

-- CreateEnum
CREATE TYPE "MonitorType" AS ENUM ('HTTP', 'PING', 'TCP');

-- CreateEnum
CREATE TYPE "MonitorStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DELETED');

-- CreateEnum
CREATE TYPE "MonitorBodyMatchType" AS ENUM ('NONE', 'CONTAINS', 'REGEX', 'JSON_PATH');

-- CreateEnum
CREATE TYPE "CheckResult" AS ENUM ('UP', 'DOWN', 'DEGRADED');

-- CreateEnum
CREATE TYPE "AlertChannelType" AS ENUM ('DISCORD_WEBHOOK', 'SLACK_WEBHOOK', 'GENERIC_WEBHOOK', 'EMAIL');

-- CreateEnum
CREATE TYPE "AlertEvent" AS ENUM ('DOWN', 'UP', 'DEGRADED', 'CERT_EXPIRY');

-- CreateEnum
CREATE TYPE "SubscriberEvent" AS ENUM ('INCIDENT_CREATED', 'INCIDENT_UPDATED', 'INCIDENT_RESOLVED', 'MAINTENANCE_SCHEDULED', 'MAINTENANCE_UPDATED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "hashedPassword" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'BASE_USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityTitle" TEXT,
    "userId" TEXT,
    "userName" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusPageSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "homePageDisplay" "HomePageDisplay" NOT NULL DEFAULT 'BOTH',
    "showRecentHistory" BOOLEAN NOT NULL DEFAULT true,
    "recentHistoryDays" INTEGER NOT NULL DEFAULT 14,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusPageSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "defaultOpen" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,

    CONSTRAINT "StatusGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusComponent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "status" "ComponentStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "groupId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "showUptime" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'INVESTIGATING',
    "impact" TEXT NOT NULL DEFAULT 'none',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "postmortemBody" TEXT,
    "postmortemPublishedAt" TIMESTAMP(3),

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentComponent" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "status" "ComponentStatus" NOT NULL,

    CONSTRAINT "IncidentComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentUpdate" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "IncidentStatus" NOT NULL,
    "incidentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledMaintenance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'NOT_STARTED_YET',
    "impact" TEXT NOT NULL DEFAULT 'none',
    "description" TEXT,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceComponent" (
    "id" TEXT NOT NULL,
    "maintenanceId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,

    CONSTRAINT "MaintenanceComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceUpdate" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "maintenanceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Monitor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MonitorType" NOT NULL DEFAULT 'HTTP',
    "target" TEXT NOT NULL,
    "port" INTEGER,
    "interval" INTEGER NOT NULL DEFAULT 60,
    "timeout" INTEGER NOT NULL DEFAULT 10,
    "downThreshold" INTEGER NOT NULL DEFAULT 2,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "status" "MonitorStatus" NOT NULL DEFAULT 'ACTIVE',
    "componentId" TEXT,
    "headers" JSONB,
    "expectedStatusCodes" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "bodyMatchType" "MonitorBodyMatchType" NOT NULL DEFAULT 'NONE',
    "expectedBodyContains" TEXT,
    "expectedBodyValue" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "lastStatus" "CheckResult",
    "lastResponseMs" INTEGER,
    "uptime7d" DOUBLE PRECISION,
    "uptime30d" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Monitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitorCheck" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,
    "result" "CheckResult" NOT NULL,
    "responseMs" INTEGER,
    "statusCode" INTEGER,
    "error" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonitorCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertChannel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AlertChannelType" NOT NULL,
    "config" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT,
    "groupId" TEXT,
    "channelId" TEXT NOT NULL,
    "events" "AlertEvent"[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertNotification" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "event" "AlertEvent" NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,

    CONSTRAINT "AlertNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "token" TEXT NOT NULL,
    "userId" TEXT,
    "events" "SubscriberEvent"[] DEFAULT ARRAY['INCIDENT_CREATED', 'INCIDENT_UPDATED', 'INCIDENT_RESOLVED', 'MAINTENANCE_SCHEDULED', 'MAINTENANCE_UPDATED']::"SubscriberEvent"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookSubscriber" (
    "id" TEXT NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "events" "SubscriberEvent"[] DEFAULT ARRAY['INCIDENT_CREATED', 'INCIDENT_UPDATED', 'INCIDENT_RESOLVED', 'MAINTENANCE_SCHEDULED', 'MAINTENANCE_UPDATED']::"SubscriberEvent"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_StatusGroupToStatusSubscriber" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StatusGroupToStatusSubscriber_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_StatusGroupToWebhookSubscriber" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StatusGroupToWebhookSubscriber_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_StatusComponentToStatusSubscriber" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StatusComponentToStatusSubscriber_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_StatusComponentToWebhookSubscriber" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StatusComponentToWebhookSubscriber_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentComponent_incidentId_componentId_key" ON "IncidentComponent"("incidentId", "componentId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceComponent_maintenanceId_componentId_key" ON "MaintenanceComponent"("maintenanceId", "componentId");

-- CreateIndex
CREATE UNIQUE INDEX "Monitor_componentId_key" ON "Monitor"("componentId");

-- CreateIndex
CREATE INDEX "MonitorCheck_monitorId_checkedAt_idx" ON "MonitorCheck"("monitorId", "checkedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StatusSubscriber_email_key" ON "StatusSubscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StatusSubscriber_token_key" ON "StatusSubscriber"("token");

-- CreateIndex
CREATE UNIQUE INDEX "StatusSubscriber_userId_key" ON "StatusSubscriber"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookSubscriber_webhookUrl_key" ON "WebhookSubscriber"("webhookUrl");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookSubscriber_token_key" ON "WebhookSubscriber"("token");

-- CreateIndex
CREATE INDEX "_StatusGroupToStatusSubscriber_B_index" ON "_StatusGroupToStatusSubscriber"("B");

-- CreateIndex
CREATE INDEX "_StatusGroupToWebhookSubscriber_B_index" ON "_StatusGroupToWebhookSubscriber"("B");

-- CreateIndex
CREATE INDEX "_StatusComponentToStatusSubscriber_B_index" ON "_StatusComponentToStatusSubscriber"("B");

-- CreateIndex
CREATE INDEX "_StatusComponentToWebhookSubscriber_B_index" ON "_StatusComponentToWebhookSubscriber"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusGroup" ADD CONSTRAINT "StatusGroup_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StatusGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusComponent" ADD CONSTRAINT "StatusComponent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StatusGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentComponent" ADD CONSTRAINT "IncidentComponent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentComponent" ADD CONSTRAINT "IncidentComponent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "StatusComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentUpdate" ADD CONSTRAINT "IncidentUpdate_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceComponent" ADD CONSTRAINT "MaintenanceComponent_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "ScheduledMaintenance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceComponent" ADD CONSTRAINT "MaintenanceComponent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "StatusComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceUpdate" ADD CONSTRAINT "MaintenanceUpdate_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "ScheduledMaintenance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monitor" ADD CONSTRAINT "Monitor_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "StatusComponent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitorCheck" ADD CONSTRAINT "MonitorCheck_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StatusGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "AlertChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusSubscriber" ADD CONSTRAINT "StatusSubscriber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StatusGroupToStatusSubscriber" ADD CONSTRAINT "_StatusGroupToStatusSubscriber_A_fkey" FOREIGN KEY ("A") REFERENCES "StatusGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StatusGroupToStatusSubscriber" ADD CONSTRAINT "_StatusGroupToStatusSubscriber_B_fkey" FOREIGN KEY ("B") REFERENCES "StatusSubscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StatusGroupToWebhookSubscriber" ADD CONSTRAINT "_StatusGroupToWebhookSubscriber_A_fkey" FOREIGN KEY ("A") REFERENCES "StatusGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StatusGroupToWebhookSubscriber" ADD CONSTRAINT "_StatusGroupToWebhookSubscriber_B_fkey" FOREIGN KEY ("B") REFERENCES "WebhookSubscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StatusComponentToStatusSubscriber" ADD CONSTRAINT "_StatusComponentToStatusSubscriber_A_fkey" FOREIGN KEY ("A") REFERENCES "StatusComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StatusComponentToStatusSubscriber" ADD CONSTRAINT "_StatusComponentToStatusSubscriber_B_fkey" FOREIGN KEY ("B") REFERENCES "StatusSubscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StatusComponentToWebhookSubscriber" ADD CONSTRAINT "_StatusComponentToWebhookSubscriber_A_fkey" FOREIGN KEY ("A") REFERENCES "StatusComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StatusComponentToWebhookSubscriber" ADD CONSTRAINT "_StatusComponentToWebhookSubscriber_B_fkey" FOREIGN KEY ("B") REFERENCES "WebhookSubscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

