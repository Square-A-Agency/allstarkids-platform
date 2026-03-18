import type { ApplicationData, FieldEntry } from '../types'

export default function transportationMap(data: ApplicationData): FieldEntry[] {
  return [
    { type: 'text', page: 0, x: 0, y: 0, value: `${data.child.firstName} ${data.child.lastName}` },
    { type: 'text', page: 0, x: 0, y: 0, value: data.transport.pickupLocation ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.transport.pickupTime ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.transport.deliveryLocation ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.transport.deliveryTime ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.transport.days.join(', ') },
    { type: 'text', page: 0, x: 0, y: 0, value: data.transport.authorizedPerson ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: data.transport.fallbackProcedure ?? '' },
    { type: 'text', page: 0, x: 0, y: 0, value: `${data.parent1.firstName} ${data.parent1.lastName}` },
  ]
}
