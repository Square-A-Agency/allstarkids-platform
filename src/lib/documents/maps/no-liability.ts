import type { ApplicationData, FieldEntry } from '../types'

export default function noLiabilityMap(data: ApplicationData): FieldEntry[] {
  return [
    { type: 'text', page: 0, x: 0, y: 0, value: `${data.child.firstName} ${data.child.lastName}` },
    { type: 'text', page: 0, x: 0, y: 0, value: `${data.parent1.firstName} ${data.parent1.lastName}` },
  ]
}
