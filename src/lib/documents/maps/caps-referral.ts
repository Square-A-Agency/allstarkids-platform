import type { ApplicationData, FieldEntry } from '../types'

export default function capsReferralMap(data: ApplicationData): FieldEntry[] {
  const hasCaps = Boolean(data.preK.capsCaseId)
  return [
    // Parent contact info
    { type: 'text', page: 0, x: 157, y: 500, value: `${data.parent1.firstName} ${data.parent1.lastName}` },
    { type: 'checkbox', page: 0, x: 245, y: 480, checked: hasCaps },
    { type: 'checkbox', page: 0, x: 278, y: 480, checked: !hasCaps },
    { type: 'text',     page: 0, x: 475, y: 480, value: data.preK.capsCaseId ?? '' },
    { type: 'text',     page: 0, x: 185, y: 458, value: data.parent1.phone },
    { type: 'text',     page: 0, x: 455, y: 458, value: data.parent1.email },

    // Child enrolled
    { type: 'checkbox', page: 0, x: 433, y: 432, checked: true },
    { type: 'checkbox', page: 0, x: 465, y: 432, checked: false },

    // Child info
    { type: 'text', page: 0, x: 118, y: 412, value: `${data.child.firstName} ${data.child.lastName}` },
    { type: 'text', page: 0, x: 168, y: 393, value: data.child.dateOfBirth },

    // Extended day
    { type: 'checkbox', page: 0, x: 87,  y: 355, checked: data.preK.needsExtendedDay === true },
    { type: 'checkbox', page: 0, x: 120, y: 355, checked: data.preK.needsExtendedDay === false },
  ]
}
