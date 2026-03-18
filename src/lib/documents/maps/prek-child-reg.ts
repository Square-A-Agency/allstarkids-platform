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

    // Child identity (character-box fields; text placed at start of first box)
    { type: 'text', page: 0, x: 155, y: 617, value: data.child.lastName },
    { type: 'text', page: 0, x: 155, y: 600, value: data.child.firstName },
    { type: 'text', page: 0, x: 155, y: 583, value: data.child.middleName ?? '' },

    // SSN, DOB, Sex
    { type: 'text', page: 0, x: 255, y: 567, value: data.child.ssn ?? '' },
    { type: 'text', page: 0, x: 355, y: 567, value: data.child.dateOfBirth },
    { type: 'checkbox', page: 0, x: 452, y: 567, checked: data.child.sex === 'M' },
    { type: 'checkbox', page: 0, x: 468, y: 567, checked: data.child.sex === 'F' },

    // Home address
    { type: 'text', page: 0, x: 300, y: 553, value: data.parent1.address },
    { type: 'text', page: 0, x: 510, y: 553, value: data.child.county ?? '' },
    { type: 'text', page: 0, x: 80,  y: 537, value: data.parent1.city },
    { type: 'text', page: 0, x: 330, y: 537, value: data.parent1.zip },
    { type: 'text', page: 0, x: 440, y: 537, value: data.parent1.phone },

    // Previous school transfer info
    { type: 'text', page: 0, x: 215, y: 508, value: data.preK.previousSchool ?? '' },
    { type: 'text', page: 0, x: 545, y: 508, value: data.preK.lastDatePreviousSchool ?? '' },

    // Parent/Guardian #1
    { type: 'text', page: 0, x: 242, y: 452, value: data.parent1.lastName },
    { type: 'text', page: 0, x: 370, y: 452, value: data.parent1.firstName },
    { type: 'text', page: 0, x: 200, y: 437, value: data.parent1.address },
    { type: 'text', page: 0, x: 80,  y: 422, value: data.parent1.city },
    { type: 'text', page: 0, x: 330, y: 422, value: data.parent1.zip },
    { type: 'text', page: 0, x: 100, y: 407, value: data.parent1.phone },
    { type: 'text', page: 0, x: 355, y: 407, value: data.parent1.phone },  // cell same as phone
    { type: 'text', page: 0, x: 100, y: 393, value: data.parent1.email },
    { type: 'text', page: 0, x: 180, y: 378, value: data.parent1.employer ?? '' },
    { type: 'text', page: 0, x: 440, y: 378, value: data.parent1.workPhone ?? '' },
    { type: 'text', page: 0, x: 80,  y: 363, value: data.parent1.employerAddress ?? '' },

    // Parent/Guardian #2
    { type: 'text', page: 0, x: 242, y: 330, value: data.parent2.lastName ?? '' },
    { type: 'text', page: 0, x: 370, y: 330, value: data.parent2.firstName ?? '' },
    { type: 'text', page: 0, x: 200, y: 315, value: data.parent2.address ?? '' },
    { type: 'text', page: 0, x: 100, y: 285, value: data.parent2.phone ?? '' },
    { type: 'text', page: 0, x: 180, y: 256, value: data.parent2.employer ?? '' },
    { type: 'text', page: 0, x: 440, y: 256, value: data.parent2.workPhone ?? '' },
    { type: 'text', page: 0, x: 80,  y: 241, value: data.parent2.employerAddress ?? '' },

    // Emergency contacts (columns: name @ x=55, relationship @ x=155, cell @ x=265, alt phone @ x=375, email @ x=460)
    ...(ec0 ? [
      { type: 'text' as const, page: 0, x: 55,  y: 177, value: ec0.name },
      { type: 'text' as const, page: 0, x: 155, y: 177, value: ec0.relationship },
      { type: 'text' as const, page: 0, x: 265, y: 177, value: ec0.phone },
    ] : []),
    ...(ec1 ? [
      { type: 'text' as const, page: 0, x: 55,  y: 162, value: ec1.name },
      { type: 'text' as const, page: 0, x: 155, y: 162, value: ec1.relationship },
      { type: 'text' as const, page: 0, x: 265, y: 162, value: ec1.phone },
    ] : []),

    // ── Page 1: Child Maintenance (Page 2 of 3) ─────────────────────────

    // Living arrangements checkboxes
    { type: 'checkbox', page: 1, x: 265, y: 690, checked: data.livingArrangement === 'BOTH_PARENTS' },
    { type: 'checkbox', page: 1, x: 360, y: 690, checked: data.livingArrangement === 'MOTHER' },
    { type: 'checkbox', page: 1, x: 403, y: 690, checked: data.livingArrangement === 'FATHER' },
    { type: 'checkbox', page: 1, x: 448, y: 690, checked: data.livingArrangement === 'OTHER' },

    // Legal guardian checkboxes
    { type: 'checkbox', page: 1, x: 265, y: 675, checked: data.legalGuardian === 'BOTH_PARENTS' },
    { type: 'checkbox', page: 1, x: 360, y: 675, checked: data.legalGuardian === 'MOTHER' },
    { type: 'checkbox', page: 1, x: 403, y: 675, checked: data.legalGuardian === 'FATHER' },
    { type: 'checkbox', page: 1, x: 448, y: 675, checked: data.legalGuardian === 'OTHER' },

    // Authorized pickups (columns: name @ x=37, address @ x=170, relationship @ x=350, cell @ x=440)
    ...(p0 ? [
      { type: 'text' as const, page: 1, x: 37,  y: 640, value: p0.name },
      { type: 'text' as const, page: 1, x: 170, y: 640, value: p0.address },
      { type: 'text' as const, page: 1, x: 350, y: 640, value: p0.relationship },
      { type: 'text' as const, page: 1, x: 440, y: 640, value: p0.phone },
    ] : []),
    ...(p1 ? [
      { type: 'text' as const, page: 1, x: 37,  y: 625, value: p1.name },
      { type: 'text' as const, page: 1, x: 170, y: 625, value: p1.address },
      { type: 'text' as const, page: 1, x: 350, y: 625, value: p1.relationship },
      { type: 'text' as const, page: 1, x: 440, y: 625, value: p1.phone },
    ] : []),
    ...(p2 ? [
      { type: 'text' as const, page: 1, x: 37,  y: 610, value: p2.name },
      { type: 'text' as const, page: 1, x: 170, y: 610, value: p2.address },
      { type: 'text' as const, page: 1, x: 350, y: 610, value: p2.relationship },
      { type: 'text' as const, page: 1, x: 440, y: 610, value: p2.phone },
    ] : []),
    ...(p3 ? [
      { type: 'text' as const, page: 1, x: 37,  y: 595, value: p3.name },
      { type: 'text' as const, page: 1, x: 170, y: 595, value: p3.address },
      { type: 'text' as const, page: 1, x: 350, y: 595, value: p3.relationship },
      { type: 'text' as const, page: 1, x: 440, y: 595, value: p3.phone },
    ] : []),

    // Physician / health screening
    { type: 'text', page: 1, x: 370, y: 575, value: [data.doctor.clinicName, data.doctor.name].filter(Boolean).join(' / ') },
    { type: 'text', page: 1, x: 195, y: 558, value: data.preK.lastHealthScreening ?? '' },
    { type: 'text', page: 1, x: 450, y: 558, value: data.doctor.phone ?? '' },

    // Special needs / accommodations / medications
    { type: 'text', page: 1, x: 37, y: 520, value: data.specialNeeds ?? '' },
    { type: 'text', page: 1, x: 37, y: 460, value: data.specialAccommodations ?? '' },
    { type: 'text', page: 1, x: 37, y: 393, value: [data.allergies, data.medications].filter(Boolean).join('; ') },

    // ── Page 2: General Release / Photo Release (Page 3 of 3) ────────────

    // Child name in photo release
    { type: 'text', page: 2, x: 85, y: 450, value: `${data.child.firstName} ${data.child.lastName}` },
  ]
}
