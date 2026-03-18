import type { ApplicationData, FieldEntry } from '../types'

const DAY_Y: Record<string, number> = {
  Monday:    430,
  Tuesday:   415,
  Wednesday: 400,
  Thursday:  386,
  Friday:    372,
}

export default function transportationMap(data: ApplicationData): FieldEntry[] {
  const t = data.transport
  return [
    // Child name
    { type: 'text', page: 0, x: 355, y: 651, value: `${data.child.firstName} ${data.child.lastName}` },

    // Morning pickup route
    { type: 'text', page: 0, x: 165, y: 600, value: t.pickupLocation ?? '' },
    { type: 'text', page: 0, x: 455, y: 600, value: t.pickupTime ?? '' },

    // Afternoon delivery route
    { type: 'text', page: 0, x: 85,  y: 553, value: t.deliveryLocation ?? '' },
    { type: 'text', page: 0, x: 455, y: 553, value: t.deliveryTime ?? '' },

    // Day checkboxes
    ...Object.entries(DAY_Y).map(([day, y]) => ({
      type: 'checkbox' as const,
      page: 0,
      x: 85,
      y,
      checked: t.days.includes(day),
    })),

    // Authorization
    { type: 'text', page: 0, x: 85, y: 355, value: t.authorizedPerson ?? '' },
    { type: 'text', page: 0, x: 85, y: 268, value: t.fallbackProcedure ?? '' },

    // Parent name
    { type: 'text', page: 0, x: 85, y: 120, value: `${data.parent1.firstName} ${data.parent1.lastName}` },
  ]
}
