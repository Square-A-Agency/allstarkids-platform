import type { ApplicationData, FieldEntry } from '../types'

export default function ssnInformationMap(data: ApplicationData): FieldEntry[] {
  const reason = data.preK.ssnNotProvidedReason?.toLowerCase() ?? ''
  // Exclusive match, and 'await' is tested before 'replac' because the natural
  // phrasing "awaiting a replacement SSN" contains both substrings.
  const isObtaining = reason !== '' && reason.includes('obtain')
  const isAwaiting  = !isObtaining && reason.includes('await')
  const isReplacing = !isObtaining && !isAwaiting && reason.includes('replac')
  const isForgot    = !isObtaining && !isAwaiting && !isReplacing && (reason.includes('forgot') || reason.includes('left at home'))
  const isChoseNot  = reason !== '' && !isObtaining && !isAwaiting && !isReplacing && !isForgot

  return [
    { type: 'text', page: 0, x: 115, y: 620, value: new Date().toLocaleDateString('en-US') },
    { type: 'text', page: 0, x: 62,  y: 427, value: `${data.parent1.firstName} ${data.parent1.lastName}` },
    { type: 'text', page: 0, x: 345, y: 427, value: `${data.child.firstName} ${data.child.lastName}` },

    // Reason checkboxes (square boxes at x 59-77 on each reason row)
    { type: 'checkbox', page: 0, x: 64, y: 385, checked: isObtaining },
    { type: 'checkbox', page: 0, x: 64, y: 357, checked: isReplacing },
    { type: 'checkbox', page: 0, x: 64, y: 330, checked: isAwaiting },
    { type: 'checkbox', page: 0, x: 64, y: 302, checked: isForgot },
    { type: 'checkbox', page: 0, x: 64, y: 274, checked: isChoseNot },
    { type: 'text',     page: 0, x: 275, y: 275, fontSize: 8, value: isChoseNot ? (data.preK.ssnNotProvidedReason ?? '') : '' },
  ]
}
