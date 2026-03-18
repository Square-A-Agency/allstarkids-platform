import type { ApplicationData, FieldEntry } from '../types'

export default function authorizationTopicalMap(data: ApplicationData): FieldEntry[] {
  const t = data.topical
  return [
    // Child and parent names
    { type: 'text', page: 0, x: 85,  y: 650, value: `${data.child.firstName} ${data.child.lastName}` },
    { type: 'text', page: 0, x: 85,  y: 310, value: `${data.parent1.firstName} ${data.parent1.lastName}` },

    // Topical medication checkboxes
    { type: 'checkbox', page: 0, x: 143, y: 568, checked: t.babyWipes },
    { type: 'checkbox', page: 0, x: 143, y: 551, checked: t.bandaids },
    { type: 'checkbox', page: 0, x: 143, y: 527, checked: t.neosporin },
    { type: 'checkbox', page: 0, x: 143, y: 503, checked: t.bactine },
    { type: 'checkbox', page: 0, x: 143, y: 479, checked: t.sunscreen },
    { type: 'checkbox', page: 0, x: 143, y: 455, checked: t.insectRepellent },
    { type: 'checkbox', page: 0, x: 143, y: 427, checked: t.nonRxOintment },
    { type: 'checkbox', page: 0, x: 143, y: 400, checked: t.babyPowder },
    { type: 'checkbox', page: 0, x: 143, y: 376, checked: t.other },
  ]
}
