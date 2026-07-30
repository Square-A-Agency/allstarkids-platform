import { describe, it, expect } from 'vitest'
import ssnInformationMap from '../maps/ssn-information'
import type { ApplicationData } from '../types'

function makeData(ssnNotProvidedReason: string | null): ApplicationData {
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
    preK: { previousSchool: null, lastDatePreviousSchool: null, lastHealthScreening: null, ssnNotProvidedReason, needsExtendedDay: null, capsCaseId: null },
  }
}

function checkedCount(reason: string | null): number {
  return ssnInformationMap(makeData(reason)).filter((f) => f.type === 'checkbox' && f.checked).length
}

describe('ssnInformationMap reason checkboxes', () => {
  // "awaiting a replacement SSN" contains both "await" and "replac" — exactly
  // one box may be checked or the filed form contradicts itself.
  it('checks exactly one box for "awaiting a replacement SSN card"', () => {
    expect(checkedCount('I am awaiting a replacement SSN card')).toBe(1)
  })

  it('checks the awaiting box, not the replacing box, for a replacement in transit', () => {
    const entries = ssnInformationMap(makeData('awaiting a replacement SSN card'))
    const checked = entries.filter((f) => f.type === 'checkbox' && f.checked)
    expect(checked).toHaveLength(1)
    // The awaiting box is the third reason on the form, below obtain and replace.
    const boxes = entries.filter((f) => f.type === 'checkbox')
    expect(boxes.indexOf(checked[0])).toBe(2)
  })

  it('checks exactly one box for each canonical reason', () => {
    expect(checkedCount('I need help obtaining an SSN')).toBe(1)
    expect(checkedCount('I need help replacing a lost SSN')).toBe(1)
    expect(checkedCount('I forgot to bring the SSN')).toBe(1)
    expect(checkedCount('religious objection')).toBe(1)
  })

  it('checks nothing when no reason was given', () => {
    expect(checkedCount(null)).toBe(0)
    expect(checkedCount('')).toBe(0)
  })
})
