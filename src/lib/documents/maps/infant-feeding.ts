import type { ApplicationData, FieldEntry } from '../types'

export default function infantFeedingMap(data: ApplicationData): FieldEntry[] {
  const fp = data.infant.feedingPlan
  if (!fp) return []

  const amountAndTimes = [fp.formulaAmount, fp.feedingTimes].filter(Boolean).join(' at ')

  return [
    // Child info (page is 612x790; name line y=716, DOB line y=695)
    { type: 'text', page: 0, x: 115, y: 718, value: `${data.child.firstName} ${data.child.lastName}` },
    { type: 'text', page: 0, x: 95,  y: 697, value: data.child.dateOfBirth },

    // "What type formula used, if applicable?" line
    { type: 'text', page: 0, x: 205, y: 567, value: fp.formulaType ?? '' },
    // "Amount and time of formula/breast milk to be given?" line
    { type: 'text', page: 0, x: 254, y: 555, fontSize: 9, value: amountAndTimes },

    // Pacifier: Yes [ ] / No [ ] brackets on the pacifier row (y=449)
    { type: 'checkbox', page: 0, x: 185, y: 451, checked: fp.pacifierUse === true },
    { type: 'checkbox', page: 0, x: 221, y: 451, checked: fp.pacifierUse === false },

    // Solid-foods readiness: Yes bracket on the "foods?" row (y=382)
    { type: 'checkbox', page: 0, x: 129, y: 384, checked: fp.solidFoodsReady === true },

    // Food preferences & allergies
    { type: 'text', page: 0, x: 100, y: 255, value: fp.foodLikes ?? '' },
    { type: 'text', page: 0, x: 105, y: 237, value: fp.foodDislikes ?? '' },
    { type: 'text', page: 0, x: 228, y: 219, value: fp.allergies ?? '' },

    // The signature line at the bottom is signed by hand.
  ]
}
