import type { ApplicationData, FieldEntry } from '../types'

export default function vehicleEmergencyMap(data: ApplicationData): FieldEntry[] {
  return [
    { type: 'text', page: 0, x: 0, y: 0, value: `${data.child.firstName} ${data.child.lastName}` },
    { type: 'text', page: 0, x: 0, y: 0, value: data.child.dateOfBirth },
    { type: 'text', page: 0, x: 0, y: 0, value: `${data.parent1.address}, ${data.parent1.city}, ${data.parent1.state} ${data.parent1.zip}` },
    { type: 'text', page: 0, x: 0, y: 0, value: `${data.parent1.firstName} ${data.parent1.lastName}` },
    { type: 'text', page: 0, x: 0, y: 0, value: data.parent1.phone },
    { type: 'text', page: 0, x: 0, y: 0, value: `${data.parent2.firstName ?? ''} ${data.parent2.lastName ?? ''}`.trim() },
    { type: 'text', page: 0, x: 0, y: 0, value: data.parent2.phone ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.emergencyContacts[0]?.name ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.emergencyContacts[0]?.phone ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.doctor.name ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.doctor.phone ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.allergies ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.medications ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.specialNeeds ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: `${data.parent1.firstName} ${data.parent1.lastName}` },
  ]
}
