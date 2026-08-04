-- CreateTable
CREATE TABLE "EnrollmentDraft" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrollmentDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentDraft_clerkUserId_key" ON "EnrollmentDraft"("clerkUserId");

