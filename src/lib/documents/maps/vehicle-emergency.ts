import type { ApplicationData, FieldEntry } from '../types'

export default function vehicleEmergencyMap(data: ApplicationData): FieldEntry[] {
  const ec0 = data.emergencyContacts[0]
  return [
    // Child info
    { type: 'text', page: 0, x: 165, y: 648, value: `${data.child.firstName} ${data.child.lastName}` },
    { type: 'text', page: 0, x: 515, y: 648, value: data.child.dateOfBirth },
    { type: 'text', page: 0, x: 130, y: 623, value: data.parent1.address },

    // Father (parent2)
    { type: 'text', page: 0, x: 165, y: 598, value: `${data.parent2.firstName ?? ''} ${data.parent2.lastName ?? ''}`.trim() },
    { type: 'text', page: 0, x: 165, y: 572, value: data.parent2.phone ?? '' },
    { type: 'text', page: 0, x: 450, y: 572, value: data.parent2.workPhone ?? '' },

    // Mother (parent1)
    { type: 'text', page: 0, x: 165, y: 548, value: `${data.parent1.firstName} ${data.parent1.lastName}` },
    { type: 'text', page: 0, x: 165, y: 523, value: data.parent1.phone },
    { type: 'text', page: 0, x: 450, y: 523, value: data.parent1.workPhone ?? '' },

    // Emergency contact
    ...(ec0 ? [
      { type: 'text' as const, page: 0, x: 122, y: 455, value: ec0.name },
      { type: 'text' as const, page: 0, x: 430, y: 455, value: ec0.phone },
    ] : []),

    // Doctor name on the "Child's Doctor ___ Phone ___" row; the clinic goes
    // on the "Medical facility the center uses" line where it belongs.
    { type: 'text', page: 0, x: 157, y: 428, fontSize: 9, value: data.doctor.name ?? '' },
    { type: 'text', page: 0, x: 430, y: 428, value: data.doctor.phone ?? '' },
    { type: 'text', page: 0, x: 234, y: 400, value: data.doctor.clinicName ?? '' },

    // Medical info
    { type: 'text', page: 0, x: 165, y: 350, value: data.allergies ?? '' },
    { type: 'text', page: 0, x: 315, y: 325, value: data.medications ?? '' },
    { type: 'text', page: 0, x: 330, y: 300, value: data.specialNeeds ?? '' },

    // Child name at bottom
    { type: 'text', page: 0, x: 165, y: 150, value: `${data.child.firstName} ${data.child.lastName}` },
  ]
}
