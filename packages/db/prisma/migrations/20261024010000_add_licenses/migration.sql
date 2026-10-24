CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productSlug" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "licensee" TEXT NOT NULL,
    "features" TEXT[],
    "domains" TEXT[],
    "key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "License_userId_idx" ON "License"("userId");
CREATE INDEX "License_stripeSubscriptionId_idx" ON "License"("stripeSubscriptionId");
CREATE INDEX "License_status_idx" ON "License"("status");

ALTER TABLE "License" ADD CONSTRAINT "License_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
