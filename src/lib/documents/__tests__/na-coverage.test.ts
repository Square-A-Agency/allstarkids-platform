import { describe, it, expect } from 'vitest'
import { normalizeFields } from '../fill-pdf'
import { ageFromDob } from '../assemble-data'
import enrollmentFormMap from '../maps/enrollment-form'
import preKChildRegMap from '../maps/prek-child-reg'
import vehicleEmergencyMap from '../maps/vehicle-emergency'
import transportationMap from '../maps/transportation'
import capsReferralMap from '../maps/caps-referral'
import infantFeedingMap from '../maps/infant-feeding'
import authorizationTopicalMap from '../maps/authorization-topical'
import type { ApplicationData, FieldEntry } from '../types'

function makeData(overrides?: Partial<ApplicationData>): ApplicationData {
  return {
    applicationId: 'app_1',
    familyId: 'fam_1',
    childId: 'child_1',
    child: {
      firstName: 'Amy', lastName: 'Alpha', middleName: null,
      dateOfBirth: '03/14/2022', sex: 'F', programType: 'PRE_K',
      ssn: null, county: null,
    },
    parent1: {
      firstName: 'Ann', lastName: 'Alpha', phone: '555-0100', workPhone: null,
      address: '1 Main St', city: 'Decatur', state: 'GA', zip: '30030',
      employer: null, employerAddress: null, email: 'ann@x.test',
    },
    parent2: {
      firstName: null, lastName: null, phone: null, workPhone: null,
      address: null, employer: null, employerAddress: null,
    },
    track: 'PRE_K',
    livingArrangement: null,
    legalGuardian: null,
    pickups: [],
    emergencyContacts: [],
    doctor: { name: null, phone: null, clinicName: null },
    currentSchool: null,
    specialNeeds: null,
    specialAccommodations: null,
    allergies: null,
    medications: null,
    topical: { babyWipes: false, bandaids: false, neosporin: false, bactine: false, sunscreen: false, insectRepellent: false, nonRxOintment: false, babyPowder: false, other: false },
    schedule: { enrollmentStartMonth: null, enrollmentEndMonth: null, daysOfWeek: [], startTime: null, endTime: null, mealPlan: [] },
    transport: { uses: false, pickupLocation: null, pickupTime: null, deliveryLocation: null, deliveryTime: null, days: [], authorizedPerson: null, fallbackProcedure: null },
    infant: { feedingPlan: null },
    preK: { previousSchool: null, lastDatePreviousSchool: null, lastHealthScreening: null, ssnNotProvidedReason: null, needsExtendedDay: null, capsCaseId: null },
    ...overrides,
  }
}

function textAt(entries: FieldEntry[], page: number, x: number, y: number) {
  return entries.find((e) => e.type === 'text' && e.page === page && e.x === x && e.y === y) as
    | Extract<FieldEntry, { type: 'text' }>
    | undefined
}

// ── Layer 1: central N/A fallback ─────────────────────────────────────────────

describe('normalizeFields', () => {
  it('replaces empty text values with N/A', () => {
    const out = normalizeFields([{ type: 'text', page: 0, x: 1, y: 1, value: '' }])
    expect(out[0]).toMatchObject({ type: 'text', value: 'N/A' })
  })

  it('replaces whitespace-only text values with N/A', () => {
    const out = normalizeFields([{ type: 'text', page: 0, x: 1, y: 1, value: '   ' }])
    expect(out[0]).toMatchObject({ value: 'N/A' })
  })

  it('leaves answered text values unchanged, preserving fontSize', () => {
    const out = normalizeFields([{ type: 'text', page: 0, x: 1, y: 1, value: 'Hello', fontSize: 8 }])
    expect(out[0]).toMatchObject({ value: 'Hello', fontSize: 8 })
  })

  it('leaves checkboxes untouched', () => {
    const out = normalizeFields([{ type: 'checkbox', page: 0, x: 1, y: 1, checked: false }])
    expect(out[0]).toMatchObject({ type: 'checkbox', checked: false })
  })
})

// ── Age helper ────────────────────────────────────────────────────────────────

describe('ageFromDob', () => {
  it('computes whole years after the birthday has passed', () => {
    expect(ageFromDob('03/14/2022', new Date(2026, 7, 3))).toBe(4)
  })

  it('computes whole years before the birthday', () => {
    expect(ageFromDob('11/15/2016', new Date(2026, 7, 3))).toBe(9)
  })
})

// ── Layer 2: conditional groups always emit ───────────────────────────────────

describe('enrollmentFormMap with an unanswered application', () => {
  const entries = enrollmentFormMap(makeData())

  it('emits the pickup-1 row even with no pickups', () => {
    expect(textAt(entries, 0, 95, 145)?.value).toBe('')
    expect(textAt(entries, 0, 145, 104)?.value).toBe('')
  })

  it('emits the pickup-2 and emergency-contact rows even when absent', () => {
    expect(textAt(entries, 1, 95, 709)?.value).toBe('')
    expect(textAt(entries, 1, 95, 578)?.value).toBe('')
    expect(textAt(entries, 1, 95, 554)?.value).toBe('')
    expect(textAt(entries, 1, 95, 529)?.value).toBe('')
  })

  it('emits the withdrawal-date blank (always unanswered at enrollment)', () => {
    expect(textAt(entries, 0, 410, 575)?.value).toBe('')
  })

  it('fills the age blank with the computed age', () => {
    expect(textAt(entries, 0, 390, 552)?.value).toMatch(/^\d+$/)
  })

  it("emits mother's own-address blanks (never captured separately)", () => {
    expect(textAt(entries, 0, 330, 306)?.value).toBe('')
    expect(textAt(entries, 0, 80, 282)?.value).toBe('')
    expect(textAt(entries, 0, 326, 282)?.value).toBe('')
    expect(textAt(entries, 0, 451, 282)?.value).toBe('')
  })

  it("emits father's city/state/zip blanks only when his address is missing", () => {
    expect(textAt(entries, 0, 80, 405)?.value).toBe('')
    const withAddress = enrollmentFormMap(
      makeData({ parent2: { firstName: 'Cy', lastName: 'Alpha', phone: null, workPhone: null, address: '2 Oak St', employer: null, employerAddress: null } })
    )
    expect(textAt(withAddress, 0, 80, 405)).toBeUndefined()
  })

  it('emits employer sub-blanks only when the employer address is missing', () => {
    expect(textAt(entries, 0, 383, 356)?.value).toBe('')
    expect(textAt(entries, 0, 342, 233)?.value).toBe('')
    const withEmployer = enrollmentFormMap(
      makeData({ parent1: { ...makeData().parent1, employerAddress: '9 Work Way, Decatur, GA' } })
    )
    expect(textAt(withEmployer, 0, 342, 233)).toBeUndefined()
  })
})

describe('preKChildRegMap with an unanswered application', () => {
  const entries = preKChildRegMap(makeData())

  it('emits all four pickup rows even with no pickups', () => {
    for (const y of [627, 612, 596, 581]) {
      expect(textAt(entries, 1, 37, y)?.value).toBe('')
    }
  })

  it('emits both emergency-contact rows even when absent', () => {
    expect(textAt(entries, 0, 55, 180)?.value).toBe('')
    expect(textAt(entries, 0, 55, 165)?.value).toBe('')
  })

  it("fills parent 1's state on the home City/State/Zip row", () => {
    expect(textAt(entries, 0, 290, 428)?.value).toBe('GA')
  })

  it("emits parent 2's email blank (never collected)", () => {
    expect(textAt(entries, 0, 125, 270)?.value).toBe('')
  })

  it("duplicates parent 2's phone onto the cell blank like parent 1", () => {
    const data = makeData({ parent2: { firstName: 'Cy', lastName: 'A', phone: '555-0199', workPhone: null, address: null, employer: null, employerAddress: null } })
    expect(textAt(preKChildRegMap(data), 0, 425, 284)?.value).toBe('555-0199')
  })

  it('emits home and employer City/State/Zip sub-blanks only when the parent address is missing', () => {
    expect(textAt(entries, 0, 80, 297)?.value).toBe('')
    expect(textAt(entries, 0, 80, 357)?.value).toBe('')
    expect(textAt(entries, 0, 80, 229)?.value).toBe('')
    const withAddresses = preKChildRegMap(
      makeData({ parent2: { firstName: 'Cy', lastName: 'A', phone: null, workPhone: null, address: '2 Oak St', employer: null, employerAddress: '9 Work Way' } })
    )
    expect(textAt(withAddresses, 0, 80, 297)).toBeUndefined()
    expect(textAt(withAddresses, 0, 80, 229)).toBeUndefined()
  })
})

describe('vehicleEmergencyMap with an unanswered application', () => {
  const entries = vehicleEmergencyMap(makeData())

  it('emits the emergency-contact row even when absent', () => {
    expect(textAt(entries, 0, 122, 455)?.value).toBe('')
    expect(textAt(entries, 0, 430, 455)?.value).toBe('')
  })

  it('emits the medical-facility address blank (no data source)', () => {
    expect(textAt(entries, 0, 130, 373)?.value).toBe('')
  })
})

describe('transportationMap unmapped route and distance blanks', () => {
  const entries = transportationMap(makeData())

  it('emits the second transport row', () => {
    expect(textAt(entries, 0, 255, 519)?.value).toBe('')
    expect(textAt(entries, 0, 420, 519)?.value).toBe('')
    expect(textAt(entries, 0, 100, 492)?.value).toBe('')
    expect(textAt(entries, 0, 340, 492)?.value).toBe('')
  })

  it('emits the miles-from-center blanks', () => {
    expect(textAt(entries, 0, 110, 188)?.value).toBe('')
    expect(textAt(entries, 0, 378, 188)?.value).toBe('')
  })
})

describe('capsReferralMap provider-if-not-site blanks', () => {
  it('emits the three provider lines (site itself is the provider)', () => {
    const entries = capsReferralMap(makeData())
    expect(textAt(entries, 0, 235, 193)?.value).toBe('')
    expect(textAt(entries, 0, 144, 181)?.value).toBe('')
    expect(textAt(entries, 0, 116, 170)?.value).toBe('')
  })
})

describe('infantFeedingMap without a feeding plan', () => {
  const entries = infantFeedingMap(makeData())

  it('still emits child identity', () => {
    expect(textAt(entries, 0, 115, 718)?.value).toBe('Amy Alpha')
    expect(textAt(entries, 0, 95, 697)?.value).toBe('03/14/2022')
  })

  it('emits the formula and preference blanks as unanswered', () => {
    expect(textAt(entries, 0, 205, 567)?.value).toBe('')
    expect(textAt(entries, 0, 100, 255)?.value).toBe('')
  })

  it('emits the pacifier-when and solid-food-instruction blanks', () => {
    expect(textAt(entries, 0, 295, 451)?.value).toBe('')
    expect(textAt(entries, 0, 230, 294)?.value).toBe('')
  })

  it('fills the date blanks with the generation date', () => {
    const today = new Date().toLocaleDateString('en-US')
    expect(textAt(entries, 0, 410, 718)?.value).toBe(today)
    expect(textAt(entries, 0, 488, 555)?.value).toBe(today)
  })
})

describe('authorizationTopicalMap other-specify blank', () => {
  it('emits it as unanswered when Other is not checked', () => {
    const entries = authorizationTopicalMap(makeData())
    expect(textAt(entries, 0, 210, 370)?.value).toBe('')
  })

  it('leaves it for hand completion when Other is checked', () => {
    const data = makeData()
    data.topical.other = true
    expect(textAt(authorizationTopicalMap(data), 0, 210, 370)).toBeUndefined()
  })
})
