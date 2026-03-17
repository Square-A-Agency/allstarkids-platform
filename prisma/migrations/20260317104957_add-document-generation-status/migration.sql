-- CreateEnum
CREATE TYPE "DocumentGenerationStatus" AS ENUM ('PENDING', 'SUCCESS', 'ERROR');

-- AlterTable
ALTER TABLE "application_documents" ADD COLUMN "generationStatus" "DocumentGenerationStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "application_documents" ADD COLUMN "generationError" TEXT;
