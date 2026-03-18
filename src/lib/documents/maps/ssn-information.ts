import type { ApplicationData, FieldEntry } from '../types'

export default function ssnInformationMap(data: ApplicationData): FieldEntry[] {
  const reason = data.preK.ssnNotProvidedReason?.toLowerCase() ?? ''
  const isObtaining = reason.includes('obtain')
  const isReplacing = reason.includes('replac')
  const isAwaiting  = reason.includes('await')
  const isForgot    = reason.includes('forgot') || reason.includes('left at home')
  const isChoseNot  = reason !== '' && !isObtaining && !isReplacing && !isAwaiting && !isForgot

  return [
    { type: 'text', page: 0, x: 162, y: 615, value: new Date().toLocaleDateString('en-US') },
    { type: 'text', page: 0, x: 85,  y: 420, value: `${data.parent1.firstName} ${data.parent1.lastName}` },
    { type: 'text', page: 0, x: 460, y: 420, value: `${data.child.firstName} ${data.child.lastName}` },

    // Reason checkboxes
    { type: 'checkbox', page: 0, x: 90, y: 388, checked: isObtaining },
    { type: 'checkbox', page: 0, x: 90, y: 358, checked: isReplacing },
    { type: 'checkbox', page: 0, x: 90, y: 325, checked: isAwaiting },
    { type: 'checkbox', page: 0, x: 90, y: 300, checked: isForgot },
    { type: 'checkbox', page: 0, x: 90, y: 268, checked: isChoseNot },
    { type: 'text',     page: 0, x: 340, y: 268, value: isChoseNot ? (data.preK.ssnNotProvidedReason ?? '') : '' },
  ]
}
