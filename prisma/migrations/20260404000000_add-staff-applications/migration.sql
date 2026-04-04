-- CreateEnum
CREATE TYPE "StaffApplicationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'INTERVIEW_SCHEDULED', 'HIRED', 'REJECTED');

-- CreateTable
CREATE TABLE "staff_applications" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "yearsExp" INTEGER NOT NULL,
    "availability" TEXT NOT NULL,
    "refOneName" TEXT NOT NULL,
    "refOnePhone" TEXT NOT NULL,
    "refTwoName" TEXT NOT NULL,
    "refTwoPhone" TEXT NOT NULL,
    "coverNote" TEXT NOT NULL,
    "resumeUrl" TEXT,
    "linkedinUrl" TEXT,
    "status" "StaffApplicationStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "staff_applications_pkey" PRIMARY KEY ("id")
);
