ALTER TABLE "EnrollmentDraft" RENAME TO "enrollment_drafts";
ALTER INDEX "EnrollmentDraft_pkey" RENAME TO "enrollment_drafts_pkey";
ALTER INDEX "EnrollmentDraft_clerkUserId_key" RENAME TO "enrollment_drafts_clerkUserId_key";
