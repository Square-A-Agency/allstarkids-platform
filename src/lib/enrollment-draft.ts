import type { EnrollmentWizardState } from "@/types/enrollment";

/**
 * A saved draft is untrusted JSON: it may predate a schema change or have
 * been rejected mid-write. Restore only drafts that still look like the
 * wizard state; anything else is silently discarded by the caller.
 */
export function isWizardStateShape(v: unknown): v is EnrollmentWizardState {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const s = v as Record<string, unknown>;
  return (
    typeof s.step === "number" &&
    s.step >= 1 &&
    s.step <= 6 &&
    !!s.familyInfo &&
    typeof s.familyInfo === "object" &&
    !Array.isArray(s.familyInfo) &&
    Array.isArray(s.children)
  );
}
