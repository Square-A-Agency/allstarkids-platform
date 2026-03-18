import type { ApplicationData, FieldEntry } from '../types'

export default function preKChildRegMap(data: ApplicationData): FieldEntry[] {
  return [
    // Page 1 — Child identity
    { type: 'text', page: 0, x: 0, y: 0, value: data.child.firstName },
    { type: 'text', page: 0, x: 0, y: 0, value: data.child.lastName },
    { type: 'text', page: 0, x: 0, y: 0, value: data.child.dateOfBirth },
    { type: 'text', page: 0, x: 0, y: 0, value: data.child.sex },
    { type: 'text', page: 0, x: 0, y: 0, value: `${data.parent1.address}, ${data.parent1.city}, ${data.parent1.state} ${data.parent1.zip}` },
    { type: 'text', page: 0, x: 0, y: 0, value: data.child.county ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.parent1.phone },
    { type: 'text', page: 0, x: 0, y: 0, value: data.preK.previousSchool ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.preK.lastDatePreviousSchool ?? '' },
    // Parent/Guardian 1
    { type: 'text', page: 0, x: 0, y: 0, value: `${data.parent1.firstName} ${data.parent1.lastName}` },
    { type: 'text', page: 0, x: 0, y: 0, value: data.parent1.phone },
    { type: 'text', page: 0, x: 0, y: 0, value: data.parent1.email },
    // Parent/Guardian 2
    { type: 'text', page: 0, x: 0, y: 0, value: `${data.parent2.firstName ?? ''} ${data.parent2.lastName ?? ''}`.trim() },
    { type: 'text', page: 0, x: 0, y: 0, value: data.parent2.phone ?? '' },
    // Emergency contacts
    { type: 'text', page: 0, x: 0, y: 0, value: data.emergencyContacts[0]?.name ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.emergencyContacts[0]?.relationship ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.emergencyContacts[0]?.phone ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.emergencyContacts[1]?.name ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.emergencyContacts[1]?.phone ?? '' },
    // Page 2 — Child maintenance
    { type: 'checkbox', page: 1, x: 0, y: 0, checked: data.livingArrangement === 'BOTH_PARENTS' },
    { type: 'checkbox', page: 1, x: 0, y: 0, checked: data.livingArrangement === 'MOTHER' },
    { type: 'checkbox', page: 1, x: 0, y: 0, checked: data.livingArrangement === 'FATHER' },
    { type: 'checkbox', page: 1, x: 0, y: 0, checked: data.livingArrangement === 'OTHER' },
    // Authorized pickup slots 1–4
    { type: 'text', page: 1, x: 0, y: 0, value: data.pickups[0]?.name ?? '' },
    { type: 'text', page: 1, x: 0, y: 0, value: data.pickups[0]?.relationship ?? '' },
    { type: 'text', page: 1, x: 0, y: 0, value: data.pickups[0]?.phone ?? '' },
    { type: 'text', page: 1, x: 0, y: 0, value: data.pickups[1]?.name ?? '' },
    { type: 'text', page: 1, x: 0, y: 0, value: data.pickups[1]?.relationship ?? '' },
    { type: 'text', page: 1, x: 0, y: 0, value: data.pickups[1]?.phone ?? '' },
    { type: 'text', page: 1, x: 0, y: 0, value: data.pickups[2]?.name ?? '' },
    { type: 'text', page: 1, x: 0, y: 0, value: data.pickups[3]?.name ?? '' },
    // Medical
    { type: 'text', page: 1, x: 0, y: 0, value: data.doctor.name ?? '' },
    { type: 'text', page: 1, x: 0, y: 0, value: data.doctor.phone ?? '' },
    { type: 'text', page: 1, x: 0, y: 0, value: data.preK.lastHealthScreening ?? '' },
    { type: 'text', page: 1, x: 0, y: 0, value: data.specialNeeds ?? '' },
    { type: 'text', page: 1, x: 0, y: 0, value: data.medications ?? '' },
    { type: 'text', page: 1, x: 0, y: 0, value: data.allergies ?? '' },
  ]
}
