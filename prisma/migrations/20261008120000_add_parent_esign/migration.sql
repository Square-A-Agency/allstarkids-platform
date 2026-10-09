-- AlterTable
ALTER TABLE "enrollment_applications"
  ADD COLUMN "eSignConsentAt" TIMESTAMP(3),
  ADD COLUMN "documentsSignedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "application_documents"
  ADD COLUMN "signedFileUrl" TEXT,
  ADD COLUMN "signedAt" TIMESTAMP(3),
  ADD COLUMN "signedIp" TEXT,
  ADD COLUMN "signedUserAgent" TEXT,
  ADD COLUMN "unsignedSha256" TEXT,
  ADD COLUMN "signedSha256" TEXT;
