import type { ApplicationData, FieldEntry } from '../types'

export default function infantFeedingMap(data: ApplicationData): FieldEntry[] {
  const fp = data.infant.feedingPlan
  if (!fp) return []

  return [
    // Child info
    { type: 'text', page: 0, x: 172, y: 728, value: `${data.child.firstName} ${data.child.lastName}` },
    { type: 'text', page: 0, x: 145, y: 705, value: data.child.dateOfBirth },

    // Feeding plan
    { type: 'text', page: 0, x: 315, y: 552, value: fp.formulaType ?? '' },
    { type: 'text', page: 0, x: 375, y: 535, value: fp.formulaAmount ?? '' },
    { type: 'text', page: 0, x: 387, y: 455, value: fp.feedingTimes ?? '' },

    // Pacifier: Yes / No
    { type: 'checkbox', page: 0, x: 305, y: 455, checked: fp.pacifierUse === true },
    { type: 'checkbox', page: 0, x: 338, y: 455, checked: fp.pacifierUse === false },

    // Solid foods ready
    { type: 'checkbox', page: 0, x: 198, y: 397, checked: fp.solidFoodsReady === true },

    // Food preferences & allergies
    { type: 'text', page: 0, x: 155, y: 253, value: fp.foodLikes ?? '' },
    { type: 'text', page: 0, x: 162, y: 237, value: fp.foodDislikes ?? '' },
    { type: 'text', page: 0, x: 337, y: 215, value: fp.allergies ?? '' },

    // Parent name
    { type: 'text', page: 0, x: 225, y: 55, value: `${data.parent1.firstName} ${data.parent1.lastName}` },
  ]
}
