-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('INFANT_TODDLER', 'PRESCHOOL', 'PRE_K', 'AFTER_SCHOOL', 'SUMMER_CAMP_EAGLETS', 'SUMMER_CAMP_EAGLES');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'PLAYDATE_SCHEDULED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApplicationTrack" AS ENUM ('UNIVERSAL', 'PRE_K');

-- CreateEnum
CREATE TYPE "LivingArrangement" AS ENUM ('BOTH_PARENTS', 'MOTHER', 'FATHER', 'OTHER');

-- CreateTable
CREATE TABLE "families" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'GA',
    "zip" TEXT NOT NULL,
    "parent2FirstName" TEXT,
    "parent2LastName" TEXT,
    "parent2Email" TEXT,
    "parent2Phone" TEXT,
    "parent2WorkPhone" TEXT,
    "parent2Employer" TEXT,
    "parent2EmployerAddress" TEXT,
    "parent2Address" TEXT,

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "children" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "familyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "nameSuffix" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "sex" TEXT NOT NULL,
    "programType" "ProgramType" NOT NULL,
    "track" "ApplicationTrack" NOT NULL,

    CONSTRAINT "children_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_applications" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "familyId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "track" "ApplicationTrack" NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "enrollmentStartMonth" TEXT,
    "enrollmentEndMonth" TEXT,
    "daysOfWeek" TEXT[],
    "startTime" TEXT,
    "endTime" TEXT,
    "mealPlan" TEXT[],
    "livingArrangement" "LivingArrangement",
    "legalGuardian" "LivingArrangement",
    "authorizedPickups" JSONB,
    "emergencyContacts" JSONB,
    "doctorName" TEXT,
    "doctorPhone" TEXT,
    "clinicName" TEXT,
    "specialNeeds" TEXT,
    "specialAccommodations" TEXT,
    "medications" TEXT,
    "allergies" TEXT,
    "currentSchool" TEXT,
    "topicalPreparations" JSONB,
    "usesTransportation" BOOLEAN NOT NULL DEFAULT false,
    "transportPickupLocation" TEXT,
    "transportPickupTime" TEXT,
    "transportDeliveryLocation" TEXT,
    "transportDeliveryTime" TEXT,
    "transportDays" TEXT[],
    "transportAuthorizedPerson" TEXT,
    "transportFallbackProcedure" TEXT,
    "infantFeedingPlan" JSONB,
    "preKSsn" TEXT,
    "preKCounty" TEXT,
    "preKPreviousSchool" TEXT,
    "preKLastDatePreviousSchool" TEXT,
    "preKLastHealthScreening" TEXT,
    "preKEthnicity" TEXT,
    "preKRace" TEXT[],
    "preKPrimaryLanguage" TEXT,
    "preKBirthType" TEXT,
    "preKSpecialEdServices" TEXT[],
    "preKGovtServices" TEXT[],
    "preKTransportation" BOOLEAN,
    "preKSsnNotProvidedReason" TEXT,
    "capsReceived" BOOLEAN,
    "capsCaseId" TEXT,
    "needsExtendedDay" BOOLEAN,
    "signatureParent" TEXT,
    "signatureDate" TIMESTAMP(3),
    "signatureDirector" TEXT,
    "signatureDirectorDate" TIMESTAMP(3),
    "playdateScheduledAt" TIMESTAMP(3),
    "playdateNotes" TEXT,
    "rejectionReason" TEXT,
    "adminNotes" TEXT,

    CONSTRAINT "enrollment_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_documents" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applicationId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,

    CONSTRAINT "application_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "families_clerkUserId_key" ON "families"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_applications_childId_key" ON "enrollment_applications"("childId");

-- AddForeignKey
ALTER TABLE "children" ADD CONSTRAINT "children_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_applications" ADD CONSTRAINT "enrollment_applications_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_applications" ADD CONSTRAINT "enrollment_applications_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "enrollment_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
