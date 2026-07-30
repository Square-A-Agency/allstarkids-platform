import type { ApplicationData, FieldEntry } from '../types'

export default function noLiabilityMap(data: ApplicationData): FieldEntry[] {
  return [
    // Print-names line (x 82-268) and its date blank (x 334-424)
    { type: 'text', page: 0, x: 90,  y: 474, value: `${data.parent1.firstName} ${data.parent1.lastName}` },
    { type: 'text', page: 0, x: 345, y: 474, value: new Date().toLocaleDateString('en-US') },
  ]
}
