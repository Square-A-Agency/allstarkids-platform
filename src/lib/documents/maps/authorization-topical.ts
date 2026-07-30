import type { ApplicationData, FieldEntry } from '../types'

export default function authorizationTopicalMap(data: ApplicationData): FieldEntry[] {
  const t = data.topical
  return [
    // Item blanks sit at x 90-121 on each row; the X goes on the blank.
    // Everything else on this form (facility name is baked into the template,
    // signature and its date) is completed by hand at signing.
    { type: 'checkbox', page: 0, x: 100, y: 572, checked: t.babyWipes },
    { type: 'checkbox', page: 0, x: 100, y: 547, checked: t.bandaids },
    { type: 'checkbox', page: 0, x: 100, y: 521, checked: t.neosporin },
    { type: 'checkbox', page: 0, x: 100, y: 496, checked: t.bactine },
    { type: 'checkbox', page: 0, x: 100, y: 471, checked: t.sunscreen },
    { type: 'checkbox', page: 0, x: 100, y: 446, checked: t.insectRepellent },
    { type: 'checkbox', page: 0, x: 100, y: 420, checked: t.nonRxOintment },
    { type: 'checkbox', page: 0, x: 100, y: 395, checked: t.babyPowder },
    { type: 'checkbox', page: 0, x: 100, y: 370, checked: t.other },
  ]
}
