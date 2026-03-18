import type { ApplicationData, FieldEntry } from '../types'

export default function capsReferralMap(data: ApplicationData): FieldEntry[] {
  return [
    { type: 'text', page: 0, x: 0, y: 0, value: `${data.child.firstName} ${data.child.lastName}` },
    { type: 'text', page: 0, x: 0, y: 0, value: data.child.dateOfBirth },
    { type: 'text', page: 0, x: 0, y: 0, value: `${data.parent1.firstName} ${data.parent1.lastName}` },
    { type: 'text', page: 0, x: 0, y: 0, value: data.parent1.phone },
    { type: 'text', page: 0, x: 0, y: 0, value: data.parent1.address },
    { type: 'text', page: 0, x: 0, y: 0, value: data.preK.capsCaseId ?? '' },
  ]
}
