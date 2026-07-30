import type { ApplicationData, FieldEntry } from '../types'

export default function capsReferralMap(data: ApplicationData): FieldEntry[] {
  const hasCaps = Boolean(data.preK.capsCaseId)
  return [
    // Family information (labels measured: Name: y=503, CAPS? row y=490,
    // Phone/Email row y=466, enrolled row y=442, child rows y=430/418,
    // extended-day row y=382)
    { type: 'text', page: 0, x: 95, y: 505, value: `${data.parent1.firstName} ${data.parent1.lastName}` },
    { type: 'checkbox', page: 0, x: 195, y: 491, checked: hasCaps },
    { type: 'checkbox', page: 0, x: 266, y: 491, checked: !hasCaps },
    { type: 'text',     page: 0, x: 434, y: 492, fontSize: 8, value: data.preK.capsCaseId ?? '' },
    { type: 'text',     page: 0, x: 103, y: 468, value: data.parent1.phone },
    { type: 'text',     page: 0, x: 398, y: 468, fontSize: 8, value: data.parent1.email },

    // Child enrolled in Georgia's Pre-K classroom: always Yes on a referral
    { type: 'checkbox', page: 0, x: 282, y: 443, checked: true },

    // Child info
    { type: 'text', page: 0, x: 95,  y: 432, value: `${data.child.firstName} ${data.child.lastName}` },
    { type: 'text', page: 0, x: 124, y: 420, value: data.child.dateOfBirth },

    // Needs care before/after the instructional day
    { type: 'checkbox', page: 0, x: 51,  y: 383, checked: data.preK.needsExtendedDay === true },
    { type: 'checkbox', page: 0, x: 104, y: 383, checked: data.preK.needsExtendedDay === false },
  ]
}
