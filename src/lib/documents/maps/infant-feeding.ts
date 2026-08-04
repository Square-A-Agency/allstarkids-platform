import type { ApplicationData, FieldEntry } from '../types'

export default function infantFeedingMap(data: ApplicationData): FieldEntry[] {
  // An absent plan still produces the form, with every blank reading N/A
  const fp = data.infant.feedingPlan ?? {}

  const amountAndTimes = [fp.formulaAmount, fp.feedingTimes].filter(Boolean).join(' at ')
  const today = new Date().toLocaleDateString('en-US')

  return [
    // Child info (page is 612x790; name line y=716, DOB line y=695); the
    // Date blank on the name row is the date the plan was recorded
    { type: 'text', page: 0, x: 115, y: 718, value: `${data.child.firstName} ${data.child.lastName}` },
    { type: 'text', page: 0, x: 410, y: 718, value: today },
    { type: 'text', page: 0, x: 95,  y: 697, value: data.child.dateOfBirth },

    // "What type formula used, if applicable?" line
    { type: 'text', page: 0, x: 205, y: 567, value: fp.formulaType ?? '' },
    // "Amount and time of formula/breast milk to be given? ___ Date ___" line
    { type: 'text', page: 0, x: 254, y: 555, fontSize: 9, value: amountAndTimes },
    { type: 'text', page: 0, x: 488, y: 555, fontSize: 7, value: today },

    // Pacifier: Yes [ ] / No [ ] brackets on the pacifier row (y=449); the
    // "If yes, when?" blank has no data source
    { type: 'checkbox', page: 0, x: 185, y: 451, checked: fp.pacifierUse === true },
    { type: 'checkbox', page: 0, x: 221, y: 451, checked: fp.pacifierUse === false },
    { type: 'text', page: 0, x: 295, y: 451, fontSize: 9, value: '' },

    // Solid-foods readiness: Yes bracket on the "foods?" row (y=382)
    { type: 'checkbox', page: 0, x: 129, y: 384, checked: fp.solidFoodsReady === true },

    // "Instructions for the introduction of solid foods ___" (y=294): no
    // data source; parent initials on that section stay for hand completion
    { type: 'text', page: 0, x: 230, y: 294, fontSize: 9, value: '' },

    // Food preferences & allergies
    { type: 'text', page: 0, x: 100, y: 255, value: fp.foodLikes ?? '' },
    { type: 'text', page: 0, x: 105, y: 237, value: fp.foodDislikes ?? '' },
    { type: 'text', page: 0, x: 228, y: 219, value: fp.allergies ?? '' },

    // The updated-amounts log tables and the signature line stay blank.
  ]
}
