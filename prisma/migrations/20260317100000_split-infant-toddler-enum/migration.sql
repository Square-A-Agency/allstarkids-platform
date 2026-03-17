-- Add new enum values first (Postgres requires this before using them in UPDATE)
ALTER TYPE "ProgramType" ADD VALUE 'INFANT';
ALTER TYPE "ProgramType" ADD VALUE 'TODDLER';

-- IMPORTANT: Run these two UPDATEs separately after the ALTER statements above.
-- Assign TODDLER to children aged 12–24 months (DOB between 12 and 24 months before today),
-- and INFANT to all others with INFANT_TODDLER (DOB within last 12 months).
UPDATE children
  SET "programType" = 'TODDLER'
  WHERE "programType" = 'INFANT_TODDLER'
    AND "dateOfBirth" <= (CURRENT_DATE - INTERVAL '12 months')
    AND "dateOfBirth" > (CURRENT_DATE - INTERVAL '24 months');

UPDATE children
  SET "programType" = 'INFANT'
  WHERE "programType" = 'INFANT_TODDLER';

-- Remove old INFANT_TODDLER value by recreating the enum
-- Note: PostgreSQL does not support DROP VALUE from an enum directly.
-- We rename and recreate the enum without INFANT_TODDLER.
ALTER TYPE "ProgramType" RENAME TO "ProgramType_old";

CREATE TYPE "ProgramType" AS ENUM ('INFANT', 'TODDLER', 'PRESCHOOL', 'PRE_K', 'AFTER_SCHOOL', 'SUMMER_CAMP_EAGLETS', 'SUMMER_CAMP_EAGLES');

ALTER TABLE "children" ALTER COLUMN "programType" TYPE "ProgramType" USING "programType"::text::"ProgramType";

DROP TYPE "ProgramType_old";
