import type { ApplicationData, FieldEntry } from '../types'

// Day blanks run x 79-253 with the day label to the right of each.
const DAY_Y: Record<string, number> = {
  Monday:    423,
  Tuesday:   409,
  Wednesday: 395,
  Thursday:  381,
  Friday:    367,
}

export default function transportationMap(data: ApplicationData): FieldEntry[] {
  const t = data.transport
  return [
    // Child name ("Permission to transport my child ___", blank x 239-509)
    { type: 'text', page: 0, x: 250, y: 643, value: `${data.child.firstName} ${data.child.lastName}` },

    // Morning pickup route ("from ___ at ___ (am/pm)", y=600)
    { type: 'text', page: 0, x: 112, y: 602, fontSize: 9, value: t.pickupLocation ?? '' },
    { type: 'text', page: 0, x: 360, y: 602, fontSize: 9, value: t.pickupTime ?? '' },

    // Afternoon delivery route ("to ___ at ___ (am/pm).", y=559)
    { type: 'text', page: 0, x: 96,  y: 561, fontSize: 9, value: t.deliveryLocation ?? '' },
    { type: 'text', page: 0, x: 358, y: 561, fontSize: 9, value: t.deliveryTime ?? '' },

    // Day checkboxes
    ...Object.entries(DAY_Y).map(([day, y]) => ({
      type: 'checkbox' as const,
      page: 0,
      x: 150,
      y,
      checked: t.days.includes(day),
    })),

    // "___ is authorized to receive my child" (blank x 79-235, y=338)
    { type: 'text', page: 0, x: 85, y: 340, value: t.authorizedPerson ?? '' },
    // Fallback procedure lines (y=269/241/214); first line only
    { type: 'text', page: 0, x: 85, y: 271, value: t.fallbackProcedure ?? '' },

    // "I agree to notify the ___ (Facility)" blank (x 79-328, y=131). The
    // facility name is baked into this template's header but not this blank.
    { type: 'text', page: 0, x: 85, y: 133, value: 'All Star Kids Academy' },

    // Signature/date at the bottom are completed by hand.
  ]
}
