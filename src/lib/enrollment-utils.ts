import { ProgramType, ApplicationTrack } from "@/generated/prisma/browser";

/**
 * Determines if a child qualifies for Pre-K.
 * Georgia Pre-K rule: child must be 4 years old before September 1 of the school year.
 * School year starts in August/September. We use the upcoming Sept 1.
 */
export function getApplicationTrack(dateOfBirth: Date): ApplicationTrack {
  const today = new Date();
  const currentYear = today.getFullYear();
  // Use upcoming Sept 1 (if past Sept 1 of current year, use next year's)
  const sept1 = new Date(
    today >= new Date(currentYear, 8, 1) ? currentYear + 1 : currentYear,
    8,
    1
  );
  const ageAtSept1 =
    sept1.getFullYear() -
    dateOfBirth.getFullYear() -
    (sept1 <
    new Date(
      sept1.getFullYear(),
      dateOfBirth.getMonth(),
      dateOfBirth.getDate()
    )
      ? 1
      : 0);

  return ageAtSept1 === 4 ? ApplicationTrack.PRE_K : ApplicationTrack.UNIVERSAL;
}

/**
 * Returns the appropriate program type based on age at Sept 1.
 */
export function getProgramTypeFromAge(dateOfBirth: Date): ProgramType {
  const today = new Date();
  const currentYear = today.getFullYear();
  const sept1 = new Date(
    today >= new Date(currentYear, 8, 1) ? currentYear + 1 : currentYear,
    8,
    1
  );
  const ageAtSept1 =
    sept1.getFullYear() -
    dateOfBirth.getFullYear() -
    (sept1 <
    new Date(
      sept1.getFullYear(),
      dateOfBirth.getMonth(),
      dateOfBirth.getDate()
    )
      ? 1
      : 0);

  if (ageAtSept1 === 0) return ProgramType.INFANT;
  if (ageAtSept1 === 1) return ProgramType.TODDLER;
  if (ageAtSept1 === 2) return ProgramType.TODDLER; // Age 2 at Sept 1 = 24–36 months — still within Toddler room (12–24 months), not yet Preschool
  if (ageAtSept1 === 3) return ProgramType.PRESCHOOL;
  if (ageAtSept1 === 4) return ProgramType.PRE_K;
  return ProgramType.AFTER_SCHOOL;
}

export const PROGRAM_LABELS: Record<ProgramType, string> = {
  INFANT: "Infant (8 weeks–12 months)",
  TODDLER: "Toddler (12–24 months)",
  PRESCHOOL: "Preschool (Ages 3–4)",
  PRE_K: "Pre-K Classroom (Ages 4–5, Georgia Pre-K)",
  AFTER_SCHOOL: "After-School Care (Ages 5–12)",
  SUMMER_CAMP_EAGLETS: "Summer Camp — Eaglets (Ages 5–7)",
  SUMMER_CAMP_EAGLES: "Summer Camp — Eagles (Ages 8–12)",
};
