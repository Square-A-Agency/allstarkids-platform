import type { ApplicationData, FieldEntry } from '../types'

export default function authorizationTopicalMap(data: ApplicationData): FieldEntry[] {
  return [
    { type: 'text',     page: 0, x: 0, y: 0, value: `${data.child.firstName} ${data.child.lastName}` },
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: data.topical.babyWipes },
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: data.topical.bandaids },
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: data.topical.neosporin },
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: data.topical.bactine },
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: data.topical.sunscreen },
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: data.topical.insectRepellent },
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: data.topical.nonRxOintment },
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: data.topical.babyPowder },
    { type: 'checkbox', page: 0, x: 0, y: 0, checked: data.topical.other },
    { type: 'text',     page: 0, x: 0, y: 0, value: `${data.parent1.firstName} ${data.parent1.lastName}` },
  ]
}
