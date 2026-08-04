import type { ApplicationData, FieldEntry } from '../types'

export default function preKChildRegMap(data: ApplicationData): FieldEntry[] {
  const p0 = data.pickups[0]
  const p1 = data.pickups[1]
  const p2 = data.pickups[2]
  const p3 = data.pickups[3]
  const ec0 = data.emergencyContacts[0]
  const ec1 = data.emergencyContacts[1]

  return [
    // ── Page 0: Pre-K Registration Form (Page 1 of 3) ───────────────────

    // Child identity (character-box rows; LAST label row measured y=618)
    { type: 'text', page: 0, x: 160, y: 621, value: data.child.lastName },
    { type: 'text', page: 0, x: 160, y: 605, value: data.child.firstName },
    { type: 'text', page: 0, x: 160, y: 590, value: data.child.middleName ?? '' },

    // SSN / D.O.B. / Sex row (labels y=572; [ ]M at x~508, [ ]F at x~536)
    { type: 'text', page: 0, x: 162, y: 574, value: data.child.ssn ?? '' },
    { type: 'text', page: 0, x: 406, y: 574, fontSize: 8, value: data.child.dateOfBirth },
    { type: 'checkbox', page: 0, x: 510, y: 574, checked: data.child.sex === 'M' },
    { type: 'checkbox', page: 0, x: 538, y: 574, checked: data.child.sex === 'F' },

    // Home address / county (row between SSN and CITY rows)
    { type: 'text', page: 0, x: 300, y: 558, value: data.parent1.address },
    { type: 'text', page: 0, x: 510, y: 558, value: data.child.county ?? '' },
    // City / Zip / Home phone row (labels y=541)
    { type: 'text', page: 0, x: 80,  y: 543, value: data.parent1.city },
    { type: 'text', page: 0, x: 364, y: 543, value: data.parent1.zip },
    { type: 'text', page: 0, x: 520, y: 543, fontSize: 8, value: data.parent1.phone },

    // Previous school transfer row (labels y=502)
    { type: 'text', page: 0, x: 155, y: 504, value: data.preK.previousSchool ?? '' },
    { type: 'text', page: 0, x: 450, y: 504, fontSize: 8, value: data.preK.lastDatePreviousSchool ?? '' },

    // Parent/Guardian #1 (LAST NAME row y=456; Cell row y=411; Work row y=382)
    { type: 'text', page: 0, x: 190, y: 458, value: data.parent1.lastName },
    { type: 'text', page: 0, x: 346, y: 458, value: data.parent1.firstName },
    { type: 'text', page: 0, x: 210, y: 443, value: data.parent1.address },
    { type: 'text', page: 0, x: 80,  y: 428, value: data.parent1.city },
    { type: 'text', page: 0, x: 290, y: 428, value: data.parent1.state },
    { type: 'text', page: 0, x: 510, y: 428, value: data.parent1.zip },
    { type: 'text', page: 0, x: 150, y: 413, fontSize: 8, value: data.parent1.phone },
    { type: 'text', page: 0, x: 425, y: 413, fontSize: 8, value: data.parent1.phone },
    { type: 'text', page: 0, x: 125, y: 399, value: data.parent1.email },
    { type: 'text', page: 0, x: 185, y: 384, value: data.parent1.employer ?? '' },
    { type: 'text', page: 0, x: 458, y: 384, fontSize: 8, value: data.parent1.workPhone ?? '' },
    { type: 'text', page: 0, x: 80,  y: 369, value: data.parent1.employerAddress ?? '' },
    // Employer City/State/Zip row (y=357): blank when the one-string employer
    // address above carries the answer, N/A when the row is unanswered
    ...(data.parent1.employerAddress ? [] : [
      { type: 'text' as const, page: 0, x: 80,  y: 357, value: '' },
      { type: 'text' as const, page: 0, x: 282, y: 357, value: '' },
      { type: 'text' as const, page: 0, x: 390, y: 357, value: '' },
    ]),

    // Parent/Guardian #2 (LAST NAME row y=325; phones row y=284; Work y=254)
    { type: 'text', page: 0, x: 190, y: 327, value: data.parent2.lastName ?? '' },
    { type: 'text', page: 0, x: 346, y: 327, value: data.parent2.firstName ?? '' },
    { type: 'text', page: 0, x: 210, y: 313, value: data.parent2.address ?? '' },
    ...(data.parent2.address ? [] : [
      { type: 'text' as const, page: 0, x: 80,  y: 297, value: '' },
      { type: 'text' as const, page: 0, x: 290, y: 297, value: '' },
      { type: 'text' as const, page: 0, x: 405, y: 297, value: '' },
    ]),
    { type: 'text', page: 0, x: 150, y: 284, fontSize: 8, value: data.parent2.phone ?? '' },
    { type: 'text', page: 0, x: 425, y: 284, fontSize: 8, value: data.parent2.phone ?? '' },
    // Parent 2's email is never collected by the application
    { type: 'text', page: 0, x: 125, y: 270, value: '' },
    { type: 'text', page: 0, x: 185, y: 256, value: data.parent2.employer ?? '' },
    { type: 'text', page: 0, x: 458, y: 256, fontSize: 8, value: data.parent2.workPhone ?? '' },
    { type: 'text', page: 0, x: 80,  y: 242, value: data.parent2.employerAddress ?? '' },
    ...(data.parent2.employerAddress ? [] : [
      { type: 'text' as const, page: 0, x: 80,  y: 229, value: '' },
      { type: 'text' as const, page: 0, x: 268, y: 229, value: '' },
      { type: 'text' as const, page: 0, x: 376, y: 229, value: '' },
    ]),

    // Emergency contacts (columns: name / relationship / cell), always
    // emitted so missing contacts read N/A rather than leaving blanks
    { type: 'text', page: 0, x: 55,  y: 180, value: ec0?.name ?? '' },
    { type: 'text', page: 0, x: 155, y: 180, value: ec0?.relationship ?? '' },
    { type: 'text', page: 0, x: 265, y: 180, value: ec0?.phone ?? '' },
    { type: 'text', page: 0, x: 55,  y: 165, value: ec1?.name ?? '' },
    { type: 'text', page: 0, x: 155, y: 165, value: ec1?.relationship ?? '' },
    { type: 'text', page: 0, x: 265, y: 165, value: ec1?.phone ?? '' },

    // ── Page 1: Child Maintenance (Page 2 of 3) ─────────────────────────

    // Living arrangements: [ ] brackets left of each label (labels y=688)
    { type: 'checkbox', page: 1, x: 198, y: 690, checked: data.livingArrangement === 'BOTH_PARENTS' },
    { type: 'checkbox', page: 1, x: 296, y: 690, checked: data.livingArrangement === 'MOTHER' },
    { type: 'checkbox', page: 1, x: 362, y: 690, checked: data.livingArrangement === 'FATHER' },
    { type: 'checkbox', page: 1, x: 425, y: 690, checked: data.livingArrangement === 'OTHER' },

    // Legal guardian row (labels y=674)
    { type: 'checkbox', page: 1, x: 198, y: 676, checked: data.legalGuardian === 'BOTH_PARENTS' },
    { type: 'checkbox', page: 1, x: 296, y: 676, checked: data.legalGuardian === 'MOTHER' },
    { type: 'checkbox', page: 1, x: 362, y: 676, checked: data.legalGuardian === 'FATHER' },
    { type: 'checkbox', page: 1, x: 425, y: 676, checked: data.legalGuardian === 'OTHER' },

    // Authorized pickups (numbered rows measured at y=625/610/594/579),
    // always emitted so unused rows read N/A
    ...[
      { p: p0, y: 627 },
      { p: p1, y: 612 },
      { p: p2, y: 596 },
      { p: p3, y: 581 },
    ].flatMap(({ p, y }) => [
      { type: 'text' as const, page: 1, x: 37,  y, value: p?.name ?? '' },
      { type: 'text' as const, page: 1, x: 145, y, value: p?.address ?? '' },
      { type: 'text' as const, page: 1, x: 350, y, value: p?.relationship ?? '' },
      { type: 'text' as const, page: 1, x: 440, y, value: p?.phone ?? '' },
    ]),

    // Physician (blank after "SOURCE):" ends x~418, narrow, hence size 8;
    // doctor name only, the clinic has no field on this form)
    { type: 'text', page: 1, x: 424, y: 567, fontSize: 8, value: data.doctor.name ?? '' },
    { type: 'text', page: 1, x: 214, y: 556, fontSize: 8, value: data.preK.lastHealthScreening ?? '' },
    { type: 'text', page: 1, x: 468, y: 556, fontSize: 8, value: data.doctor.phone ?? '' },

    // Free-text blocks: first blank line under each label
    { type: 'text', page: 1, x: 37, y: 528, value: data.specialNeeds ?? '' },
    { type: 'text', page: 1, x: 37, y: 451, value: data.specialAccommodations ?? '' },
    { type: 'text', page: 1, x: 37, y: 382, value: [data.allergies, data.medications].filter(Boolean).join('; ') },

    // ── Page 2: General Release / Photo Release (Page 3 of 3) ────────────

    // Child name on the photo-release blank (line above "NAME OF CHILD")
    { type: 'text', page: 2, x: 115, y: 447, value: `${data.child.firstName} ${data.child.lastName}` },
  ]
}
