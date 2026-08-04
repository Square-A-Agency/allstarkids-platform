import type { ApplicationData, FieldEntry } from '../types'
import { ageFromDob } from '../assemble-data'

/** "7:30 AM" -> "7:30", for blanks that print their own a.m./p.m. */
const bareTime = (t: string | null) => (t ?? '').replace(/\s*[AP]\.?M\.?\s*$/i, '')

const DAY_ABBREV: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri',
}

export default function enrollmentFormMap(data: ApplicationData): FieldEntry[] {
  const p0 = data.pickups[0]
  const p1 = data.pickups[1]
  const ec0 = data.emergencyContacts[0]
  const ec1 = data.emergencyContacts[1]
  const ec2 = data.emergencyContacts[2]

  return [
    // ── Page 0: Children's Enrollment Form ──────────────────────────────

    // Entrance date (enrollment start month used as proxy); withdrawal date
    // is never known at enrollment (blank x 401-554)
    { type: 'text', page: 0, x: 165, y: 575, value: data.schedule.enrollmentStartMonth ?? '' },
    { type: 'text', page: 0, x: 410, y: 575, value: '' },

    // Child info row ("Child's Name___Sex___ Age___ Date of birth:___", y=550)
    { type: 'text', page: 0, x: 125, y: 552, value: `${data.child.firstName} ${data.child.lastName}` },
    { type: 'text', page: 0, x: 346, y: 552, value: data.child.sex },
    { type: 'text', page: 0, x: 390, y: 552, fontSize: 9, value: String(ageFromDob(data.child.dateOfBirth, new Date())) },
    { type: 'text', page: 0, x: 490, y: 552, fontSize: 9, value: data.child.dateOfBirth },

    // Home address (parent1)
    { type: 'text', page: 0, x: 172, y: 527, value: data.parent1.address },
    { type: 'text', page: 0, x: 78,  y: 503, value: data.parent1.city },
    { type: 'text', page: 0, x: 370, y: 503, value: data.parent1.state },
    { type: 'text', page: 0, x: 492, y: 503, value: data.parent1.zip },
    { type: 'text', page: 0, x: 163, y: 478, value: data.parent1.phone },
    { type: 'text', page: 0, x: 323, y: 478, value: data.parent1.email },

    // Father (parent2); phone blank is narrow (x 469-551), hence size 8
    { type: 'text', page: 0, x: 130, y: 454, value: `${data.parent2.firstName ?? ''} ${data.parent2.lastName ?? ''}`.trim() },
    { type: 'text', page: 0, x: 471, y: 454, fontSize: 8, value: data.parent2.phone ?? '' },
    { type: 'text', page: 0, x: 322, y: 429, value: data.parent2.address ?? '' },
    // City/State/Zip sub-blanks (y=405): the address is one string, so these
    // stay blank when it exists and read N/A only when the row is unanswered
    ...(data.parent2.address ? [] : [
      { type: 'text' as const, page: 0, x: 80,  y: 405, value: '' },
      { type: 'text' as const, page: 0, x: 326, y: 405, value: '' },
      { type: 'text' as const, page: 0, x: 449, y: 405, value: '' },
    ]),
    { type: 'text', page: 0, x: 210, y: 380, value: data.parent2.employer ?? '' },
    { type: 'text', page: 0, x: 474, y: 380, fontSize: 8, value: data.parent2.workPhone ?? '' },
    { type: 'text', page: 0, x: 186, y: 356, fontSize: 8, value: data.parent2.employerAddress ?? '' },
    ...(data.parent2.employerAddress ? [] : [
      { type: 'text' as const, page: 0, x: 383, y: 356, fontSize: 8, value: '' },
      { type: 'text' as const, page: 0, x: 472, y: 356, fontSize: 8, value: '' },
      { type: 'text' as const, page: 0, x: 516, y: 356, fontSize: 8, value: '' },
    ]),

    // Mother (parent1)
    { type: 'text', page: 0, x: 135, y: 331, value: `${data.parent1.firstName} ${data.parent1.lastName}` },
    { type: 'text', page: 0, x: 471, y: 331, fontSize: 8, value: data.parent1.phone },
    // Mother's own-address rows ("if different from child's"): her address IS
    // the child's home address above, so these are always not-applicable
    { type: 'text', page: 0, x: 330, y: 306, value: '' },
    { type: 'text', page: 0, x: 80,  y: 282, value: '' },
    { type: 'text', page: 0, x: 326, y: 282, value: '' },
    { type: 'text', page: 0, x: 451, y: 282, value: '' },
    { type: 'text', page: 0, x: 210, y: 257, value: data.parent1.employer ?? '' },
    { type: 'text', page: 0, x: 474, y: 257, fontSize: 8, value: data.parent1.workPhone ?? '' },
    { type: 'text', page: 0, x: 186, y: 233, fontSize: 8, value: data.parent1.employerAddress ?? '' },
    ...(data.parent1.employerAddress ? [] : [
      { type: 'text' as const, page: 0, x: 342, y: 233, fontSize: 7, value: '' },
      { type: 'text' as const, page: 0, x: 430, y: 233, fontSize: 7, value: '' },
      { type: 'text' as const, page: 0, x: 470, y: 233, fontSize: 7, value: '' },
    ]),

    // Living Arrangements "( )" pairs sit just left of each label (row y=206)
    { type: 'checkbox', page: 0, x: 259, y: 208, checked: data.livingArrangement === 'BOTH_PARENTS' },
    { type: 'checkbox', page: 0, x: 340, y: 208, checked: data.livingArrangement === 'MOTHER' },
    { type: 'checkbox', page: 0, x: 391, y: 208, checked: data.livingArrangement === 'FATHER' },
    { type: 'checkbox', page: 0, x: 439, y: 208, checked: data.livingArrangement === 'OTHER' },

    // Legal Guardian row (y=182)
    { type: 'checkbox', page: 0, x: 246, y: 184, checked: data.legalGuardian === 'BOTH_PARENTS' },
    { type: 'checkbox', page: 0, x: 327, y: 184, checked: data.legalGuardian === 'MOTHER' },
    { type: 'checkbox', page: 0, x: 378, y: 184, checked: data.legalGuardian === 'FATHER' },
    { type: 'checkbox', page: 0, x: 426, y: 184, checked: data.legalGuardian === 'OTHER' },

    // Pickup 1 (always emitted so a missing pickup reads N/A, not blank)
    { type: 'text', page: 0, x: 95,  y: 145, value: p0?.name ?? '' },
    { type: 'text', page: 0, x: 100, y: 130, value: p0?.address ?? '' },
    { type: 'text', page: 0, x: 145, y: 104, value: p0?.phone ?? '' },
    { type: 'text', page: 0, x: 418, y: 104, fontSize: 9, value: p0?.relationship ?? '' },

    // ── Page 1: Continuation ────────────────────────────────────────────

    // Pickup 2
    { type: 'text', page: 1, x: 95,  y: 709, value: p1?.name ?? '' },
    { type: 'text', page: 1, x: 100, y: 695, value: p1?.address ?? '' },
    { type: 'text', page: 1, x: 145, y: 668, value: p1?.phone ?? '' },
    { type: 'text', page: 1, x: 418, y: 668, fontSize: 9, value: p1?.relationship ?? '' },

    // Emergency contacts ("Name ___ Telephone Number ___", rows y=576/552/527)
    { type: 'text', page: 1, x: 95,  y: 578, value: ec0?.name ?? '' },
    { type: 'text', page: 1, x: 445, y: 578, fontSize: 9, value: ec0?.phone ?? '' },
    { type: 'text', page: 1, x: 95,  y: 554, value: ec1?.name ?? '' },
    { type: 'text', page: 1, x: 445, y: 554, fontSize: 9, value: ec1?.phone ?? '' },
    { type: 'text', page: 1, x: 95,  y: 529, value: ec2?.name ?? '' },
    { type: 'text', page: 1, x: 445, y: 529, fontSize: 9, value: ec2?.phone ?? '' },

    // School, doctor, medical
    { type: 'text', page: 1, x: 337, y: 505, value: data.currentSchool ?? '' },
    { type: 'text', page: 1, x: 295, y: 480, value: [data.doctor.clinicName, data.doctor.name].filter(Boolean).join(' / ') },
    { type: 'text', page: 1, x: 245, y: 457, value: data.doctor.phone ?? '' },
    { type: 'text', page: 1, x: 385, y: 430, value: data.specialNeeds ?? '' },
    { type: 'text', page: 1, x: 285, y: 377, value: data.specialAccommodations ?? '' },
    { type: 'text', page: 1, x: 340, y: 300, value: [data.allergies, data.medications].filter(Boolean).join('; ') },

    // ── Page 2: Emergency Medical Authorization ──────────────────────────

    { type: 'text', page: 2, x: 248, y: 673, value: `${data.child.firstName} ${data.child.lastName}` },
    { type: 'text', page: 2, x: 505, y: 673, fontSize: 9, value: data.child.dateOfBirth },
    { type: 'text', page: 2, x: 200, y: 575, value: `${data.parent1.firstName} ${data.parent1.lastName}` },

    // ── Page 3: Parental Agreements ─────────────────────────────────────

    // "___ on ___ ___ a.m. to ___ p.m." (name blank x 54-293, days x 310-421,
    // time blanks print their own a.m./p.m.)
    { type: 'text', page: 3, x: 60,  y: 651, fontSize: 9, value: `${data.child.firstName} ${data.child.lastName}` },
    { type: 'text', page: 3, x: 314, y: 651, fontSize: 7, value: data.schedule.daysOfWeek.map((d) => DAY_ABBREV[d] ?? d).join('/') },
    { type: 'text', page: 3, x: 424, y: 651, fontSize: 7, value: bareTime(data.schedule.startTime) },
    { type: 'text', page: 3, x: 476, y: 651, fontSize: 7, value: bareTime(data.schedule.endTime) },
    { type: 'text', page: 3, x: 95,  y: 624, value: data.schedule.enrollmentStartMonth ?? '' },
    { type: 'text', page: 3, x: 250, y: 624, value: data.schedule.enrollmentEndMonth ?? '' },

    // Meal plan boxes sit at x 72-86 left of each label (labels y=568..522)
    { type: 'checkbox', page: 3, x: 75, y: 570, checked: data.schedule.mealPlan.includes('Breakfast') },
    { type: 'checkbox', page: 3, x: 75, y: 554, checked: data.schedule.mealPlan.includes('Lunch') },
    { type: 'checkbox', page: 3, x: 75, y: 539, checked: data.schedule.mealPlan.includes('PM Snack') },
    { type: 'checkbox', page: 3, x: 75, y: 524, checked: data.schedule.mealPlan.includes('Supper') },
  ]
}
