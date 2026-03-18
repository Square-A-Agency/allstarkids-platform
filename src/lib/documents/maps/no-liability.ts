import type { ApplicationData, FieldEntry } from '../types'

export default function noLiabilityMap(data: ApplicationData): FieldEntry[] {
  return [
    { type: 'text', page: 0, x: 85,  y: 470, value: `${data.parent1.firstName} ${data.parent1.lastName}` },
    { type: 'text', page: 0, x: 455, y: 470, value: new Date().toLocaleDateString('en-US') },
  ]
}
