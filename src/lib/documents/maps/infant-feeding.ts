import type { ApplicationData, FieldEntry } from '../types'

export default function infantFeedingMap(data: ApplicationData): FieldEntry[] {
  const plan = data.infant.feedingPlan
  return [
    { type: 'text',     page: 0, x: 0, y: 0, value: `${data.child.firstName} ${data.child.lastName}` },
    { type: 'text',     page: 0, x: 0, y: 0, value: data.child.dateOfBirth },
    { type: 'text',     page: 0, x: 0, y: 0, value: plan?.feedingMethod ?? '' },
    { type: 'text',     page: 0, x: 0, y: 0, value: plan?.formulaType ?? '' },
    { type: 'text',     page: 0, x: 0, y: 0, value: plan?.formulaAmount ?? '' },
    { type: 'text',     page: 0, x: 0, y: 0, value: plan?.feedingTimes ?? '' },
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: plan?.pacifierUse ?? false },
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: plan?.solidFoodsReady ?? false },
    { type: 'text',     page: 0, x: 0, y: 0, value: plan?.foodLikes ?? '' },
    { type: 'text',     page: 0, x: 0, y: 0, value: plan?.foodDislikes ?? '' },
    { type: 'text',     page: 0, x: 0, y: 0, value: plan?.allergies ?? '' },
    { type: 'text',     page: 0, x: 0, y: 0, value: `${data.parent1.firstName} ${data.parent1.lastName}` },
  ]
}
