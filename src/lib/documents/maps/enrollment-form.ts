import type { ApplicationData, FieldEntry } from '../types'

export default function enrollmentFormMap(data: ApplicationData): FieldEntry[] {
  const p0 = data.pickups[0]
  const p1 = data.pickups[1]
  const ec0 = data.emergencyContacts[0]
  const ec1 = data.emergencyContacts[1]
  const ec2 = data.emergencyContacts[2]

  return [
    // ── Page 0: Children's Enrollment Form ──────────────────────────────

    // Entrance date (enrollment start month used as proxy)
    { type: 'text', page: 0, x: 165, y: 573, value: data.schedule.enrollmentStartMonth ?? '' },

    // Child info
    { type: 'text', page: 0, x: 120, y: 551, value: `${data.child.firstName} ${data.child.lastName}` },
    { type: 'text', page: 0, x: 395, y: 551, value: data.child.sex },
    { type: 'text', page: 0, x: 510, y: 551, value: data.child.dateOfBirth },

    // Home address (parent1)
    { type: 'text', page: 0, x: 225, y: 527, value: data.parent1.address },
    { type: 'text', page: 0, x: 80,  y: 503, value: data.parent1.city },
    { type: 'text', page: 0, x: 408, y: 503, value: data.parent1.state },
    { type: 'text', page: 0, x: 540, y: 503, value: data.parent1.zip },
    { type: 'text', page: 0, x: 198, y: 479, value: data.parent1.phone },
    { type: 'text', page: 0, x: 430, y: 479, value: data.parent1.email },

    // Father (parent2)
    { type: 'text', page: 0, x: 165, y: 455, value: `${data.parent2.firstName ?? ''} ${data.parent2.lastName ?? ''}`.trim() },
    { type: 'text', page: 0, x: 458, y: 455, value: data.parent2.phone ?? '' },
    { type: 'text', page: 0, x: 347, y: 431, value: data.parent2.address ?? '' },
    { type: 'text', page: 0, x: 295, y: 383, value: data.parent2.employer ?? '' },
    { type: 'text', page: 0, x: 480, y: 383, value: data.parent2.workPhone ?? '' },
    { type: 'text', page: 0, x: 260, y: 359, value: data.parent2.employerAddress ?? '' },

    // Mother (parent1)
    { type: 'text', page: 0, x: 165, y: 335, value: `${data.parent1.firstName} ${data.parent1.lastName}` },
    { type: 'text', page: 0, x: 458, y: 335, value: data.parent1.phone },
    { type: 'text', page: 0, x: 295, y: 263, value: data.parent1.employer ?? '' },
    { type: 'text', page: 0, x: 478, y: 263, value: data.parent1.workPhone ?? '' },
    { type: 'text', page: 0, x: 230, y: 239, value: data.parent1.employerAddress ?? '' },

    // Living Arrangements checkboxes
    { type: 'checkbox', page: 0, x: 310, y: 215, checked: data.livingArrangement === 'BOTH_PARENTS' },
    { type: 'checkbox', page: 0, x: 406, y: 215, checked: data.livingArrangement === 'MOTHER' },
    { type: 'checkbox', page: 0, x: 447, y: 215, checked: data.livingArrangement === 'FATHER' },
    { type: 'checkbox', page: 0, x: 490, y: 215, checked: data.livingArrangement === 'OTHER' },

    // Legal Guardian checkboxes
    { type: 'checkbox', page: 0, x: 305, y: 191, checked: data.legalGuardian === 'BOTH_PARENTS' },
    { type: 'checkbox', page: 0, x: 400, y: 191, checked: data.legalGuardian === 'MOTHER' },
    { type: 'checkbox', page: 0, x: 440, y: 191, checked: data.legalGuardian === 'FATHER' },
    { type: 'checkbox', page: 0, x: 483, y: 191, checked: data.legalGuardian === 'OTHER' },

    // Pickup 1
    ...(p0 ? [
      { type: 'text' as const, page: 0, x: 120, y: 155, value: p0.name },
      { type: 'text' as const, page: 0, x: 120, y: 138, value: p0.address },
      { type: 'text' as const, page: 0, x: 195, y: 107, value: p0.phone },
      { type: 'text' as const, page: 0, x: 470, y: 107, value: p0.relationship },
    ] : []),

    // ── Page 1: Continuation ────────────────────────────────────────────

    // Pickup 2
    ...(p1 ? [
      { type: 'text' as const, page: 1, x: 120, y: 705, value: p1.name },
      { type: 'text' as const, page: 1, x: 120, y: 692, value: p1.address },
      { type: 'text' as const, page: 1, x: 195, y: 670, value: p1.phone },
      { type: 'text' as const, page: 1, x: 470, y: 670, value: p1.relationship },
    ] : []),

    // Emergency contacts
    ...(ec0 ? [
      { type: 'text' as const, page: 1, x: 120, y: 577, value: ec0.name },
      { type: 'text' as const, page: 1, x: 468, y: 577, value: ec0.phone },
    ] : []),
    ...(ec1 ? [
      { type: 'text' as const, page: 1, x: 120, y: 553, value: ec1.name },
      { type: 'text' as const, page: 1, x: 468, y: 553, value: ec1.phone },
    ] : []),
    ...(ec2 ? [
      { type: 'text' as const, page: 1, x: 120, y: 529, value: ec2.name },
      { type: 'text' as const, page: 1, x: 468, y: 529, value: ec2.phone },
    ] : []),

    // School, doctor, medical
    { type: 'text', page: 1, x: 337, y: 505, value: data.currentSchool ?? '' },
    { type: 'text', page: 1, x: 295, y: 478, value: [data.doctor.clinicName, data.doctor.name].filter(Boolean).join(' / ') },
    { type: 'text', page: 1, x: 245, y: 455, value: data.doctor.phone ?? '' },
    { type: 'text', page: 1, x: 385, y: 428, value: data.specialNeeds ?? '' },
    { type: 'text', page: 1, x: 285, y: 375, value: data.specialAccommodations ?? '' },
    { type: 'text', page: 1, x: 340, y: 298, value: [data.allergies, data.medications].filter(Boolean).join('; ') },

    // ── Page 2: Emergency Medical Authorization ──────────────────────────

    { type: 'text', page: 2, x: 248, y: 670, value: `${data.child.firstName} ${data.child.lastName}` },
    { type: 'text', page: 2, x: 513, y: 670, value: data.child.dateOfBirth },
    { type: 'text', page: 2, x: 200, y: 572, value: `${data.parent1.firstName} ${data.parent1.lastName}` },

    // ── Page 3: Parental Agreements ─────────────────────────────────────

    { type: 'text', page: 3, x: 85,  y: 643, value: `${data.child.firstName} ${data.child.lastName}` },
    { type: 'text', page: 3, x: 350, y: 643, value: data.schedule.daysOfWeek.join(', ') },
    { type: 'text', page: 3, x: 504, y: 643, value: data.schedule.startTime ?? '' },
    { type: 'text', page: 3, x: 540, y: 643, value: data.schedule.endTime ?? '' },
    { type: 'text', page: 3, x: 130, y: 618, value: data.schedule.enrollmentStartMonth ?? '' },
    { type: 'text', page: 3, x: 305, y: 618, value: data.schedule.enrollmentEndMonth ?? '' },

    // Meal plan checkboxes
    { type: 'checkbox', page: 3, x: 88, y: 568, checked: data.schedule.mealPlan.includes('Breakfast') },
    { type: 'checkbox', page: 3, x: 88, y: 551, checked: data.schedule.mealPlan.includes('Lunch') },
    { type: 'checkbox', page: 3, x: 88, y: 534, checked: data.schedule.mealPlan.includes('PM Snack') },
    { type: 'checkbox', page: 3, x: 88, y: 519, checked: data.schedule.mealPlan.includes('Supper') },
  ]
}
