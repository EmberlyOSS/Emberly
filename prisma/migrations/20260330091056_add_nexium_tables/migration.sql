-- CreateEnum
CREATE TYPE "NexiumAvailability" AS ENUM ('OPEN', 'LIMITED', 'CLOSED');

-- CreateEnum
CREATE TYPE "NexiumSkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "NexiumSignalType" AS ENUM ('GITHUB_REPO', 'DEPLOYED_APP', 'OPEN_SOURCE_CONTRIBUTION', 'SHIPPED_PRODUCT', 'COMMUNITY_IMPACT', 'ASSET_PACK', 'CERTIFICATION', 'OTHER');

-- CreateEnum
CREATE TYPE "NexiumOpportunityType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'COLLAB', 'BOUNTY');

-- CreateEnum
CREATE TYPE "NexiumOpportunityStatus" AS ENUM ('DRAFT', 'OPEN', 'FILLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "NexiumApplicationStatus" AS ENUM ('PENDING', 'VIEWED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "NexiumSquadStatus" AS ENUM ('FORMING', 'ACTIVE', 'COMPLETED', 'DISBANDED');

-- CreateEnum
CREATE TYPE "NexiumSquadRole" AS ENUM ('OWNER', 'MEMBER', 'OBSERVER');

-- CreateTable
CREATE TABLE "NexiumProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "title" TEXT,
    "headline" TEXT,
    "availability" "NexiumAvailability" NOT NULL DEFAULT 'OPEN',
    "lookingFor" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "timezone" TEXT,
    "location" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NexiumProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NexiumSkill" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "NexiumSkillLevel" NOT NULL DEFAULT 'INTERMEDIATE',
    "yearsExperience" INTEGER,
    "category" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NexiumSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NexiumSignal" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" "NexiumSignalType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "imageUrl" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NexiumSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NexiumOpportunity" (
    "id" TEXT NOT NULL,
    "postedByUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "NexiumOpportunityType" NOT NULL,
    "status" "NexiumOpportunityStatus" NOT NULL DEFAULT 'OPEN',
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "remote" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT,
    "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "teamSize" INTEGER,
    "timeCommitment" TEXT,
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NexiumOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NexiumApplication" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "NexiumApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NexiumApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NexiumSquad" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "ownerUserId" TEXT NOT NULL,
    "status" "NexiumSquadStatus" NOT NULL DEFAULT 'FORMING',
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxSize" INTEGER NOT NULL DEFAULT 5,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NexiumSquad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NexiumSquadMember" (
    "id" TEXT NOT NULL,
    "squadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "NexiumSquadRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NexiumSquadMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NexiumProfile_userId_key" ON "NexiumProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NexiumProfile_handle_key" ON "NexiumProfile"("handle");

-- CreateIndex
CREATE INDEX "NexiumProfile_handle_idx" ON "NexiumProfile"("handle");

-- CreateIndex
CREATE INDEX "NexiumProfile_availability_isVisible_idx" ON "NexiumProfile"("availability", "isVisible");

-- CreateIndex
CREATE INDEX "NexiumProfile_userId_idx" ON "NexiumProfile"("userId");

-- CreateIndex
CREATE INDEX "NexiumSkill_profileId_idx" ON "NexiumSkill"("profileId");

-- CreateIndex
CREATE INDEX "NexiumSkill_name_idx" ON "NexiumSkill"("name");

-- CreateIndex
CREATE INDEX "NexiumSignal_profileId_idx" ON "NexiumSignal"("profileId");

-- CreateIndex
CREATE INDEX "NexiumSignal_type_idx" ON "NexiumSignal"("type");

-- CreateIndex
CREATE INDEX "NexiumSignal_verified_idx" ON "NexiumSignal"("verified");

-- CreateIndex
CREATE INDEX "NexiumOpportunity_status_createdAt_idx" ON "NexiumOpportunity"("status", "createdAt");

-- CreateIndex
CREATE INDEX "NexiumOpportunity_type_status_idx" ON "NexiumOpportunity"("type", "status");

-- CreateIndex
CREATE INDEX "NexiumOpportunity_postedByUserId_idx" ON "NexiumOpportunity"("postedByUserId");

-- CreateIndex
CREATE INDEX "NexiumApplication_opportunityId_idx" ON "NexiumApplication"("opportunityId");

-- CreateIndex
CREATE INDEX "NexiumApplication_profileId_idx" ON "NexiumApplication"("profileId");

-- CreateIndex
CREATE INDEX "NexiumApplication_status_idx" ON "NexiumApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "NexiumApplication_opportunityId_profileId_key" ON "NexiumApplication"("opportunityId", "profileId");

-- CreateIndex
CREATE UNIQUE INDEX "NexiumSquad_slug_key" ON "NexiumSquad"("slug");

-- CreateIndex
CREATE INDEX "NexiumSquad_status_isPublic_idx" ON "NexiumSquad"("status", "isPublic");

-- CreateIndex
CREATE INDEX "NexiumSquad_ownerUserId_idx" ON "NexiumSquad"("ownerUserId");

-- CreateIndex
CREATE INDEX "NexiumSquadMember_squadId_idx" ON "NexiumSquadMember"("squadId");

-- CreateIndex
CREATE INDEX "NexiumSquadMember_userId_idx" ON "NexiumSquadMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NexiumSquadMember_squadId_userId_key" ON "NexiumSquadMember"("squadId", "userId");

-- AddForeignKey
ALTER TABLE "NexiumProfile" ADD CONSTRAINT "NexiumProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NexiumSkill" ADD CONSTRAINT "NexiumSkill_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "NexiumProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NexiumSignal" ADD CONSTRAINT "NexiumSignal_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "NexiumProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NexiumOpportunity" ADD CONSTRAINT "NexiumOpportunity_postedByUserId_fkey" FOREIGN KEY ("postedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NexiumApplication" ADD CONSTRAINT "NexiumApplication_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "NexiumOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NexiumApplication" ADD CONSTRAINT "NexiumApplication_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "NexiumProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NexiumSquad" ADD CONSTRAINT "NexiumSquad_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NexiumSquadMember" ADD CONSTRAINT "NexiumSquadMember_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "NexiumSquad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NexiumSquadMember" ADD CONSTRAINT "NexiumSquadMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
