-- Recreate the ProgramType enum to split INFANT_TODDLER into INFANT and TODDLER
-- This is done by renaming the old type, creating the new type with updated values,
-- and converting the column using a CASE statement.
DO $$ BEGIN
  -- Rename old type
  ALTER TYPE "ProgramType" RENAME TO "ProgramType_old";

  -- Create new type with updated enum values
  CREATE TYPE "ProgramType" AS ENUM ('INFANT', 'TODDLER', 'PRESCHOOL', 'PRE_K', 'AFTER_SCHOOL', 'SUMMER_CAMP_EAGLETS', 'SUMMER_CAMP_EAGLES');

  -- Update the column with conversion logic using CASE statement
  ALTER TABLE "children" ALTER COLUMN "programType" TYPE "ProgramType" USING
    CASE
      WHEN "programType"::text = 'INFANT_TODDLER' AND "dateOfBirth" <= (CURRENT_DATE - INTERVAL '12 months') AND "dateOfBirth" > (CURRENT_DATE - INTERVAL '24 months') THEN 'TODDLER'::"ProgramType"
      WHEN "programType"::text = 'INFANT_TODDLER' THEN 'INFANT'::"ProgramType"
      ELSE "programType"::text::"ProgramType"
    END;

  -- Drop old type
  DROP TYPE "ProgramType_old";
END $$;
