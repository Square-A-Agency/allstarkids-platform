import { describe, it, expect, beforeAll } from 'vitest'
import { randomBytes } from 'node:crypto'
import { encryptSsn } from '@/lib/ssn-crypto'
import { assembleApplicationData } from '../assemble-data'

beforeAll(() => {
  process.env.SSN_ENCRYPTION_KEY = randomBytes(32).toString('base64')
})

function makeApp(preKSsn: string | null) {
  return {
    id: 'app_1', familyId: 'fam_1', track: 'PRE_K',
    livingArrangement: null, legalGuardian: null,
    authorizedPickups: [], emergencyContacts: [],
    doctorName: null, doctorPhone: null, clinicName: null,
    currentSchool: null, specialNeeds: null, specialAccommodations: null,
    medications: null, allergies: null, topicalPreparations: null,
    enrollmentStartMonth: null, enrollmentEndMonth: null,
    daysOfWeek: [], startTime: null, endTime: null, mealPlan: [],
    usesTransportation: false, transportPickupLocation: null,
    transportPickupTime: null, transportDeliveryLocation: null,
    transportDeliveryTime: null, transportDays: [],
    transportAuthorizedPerson: null, transportFallbackProcedure: null,
    infantFeedingPlan: null,
    enrollmentStartDate: null,
    preKSsn, preKCounty: null, preKPreviousSchool: null,
    preKLastDatePreviousSchool: null, preKLastHealthScreening: null,
    preKSsnNotProvidedReason: null, needsExtendedDay: null, capsCaseId: null,
    child: {
      id: 'child_1', firstName: 'Amy', lastName: 'Alpha', middleName: null,
      dateOfBirth: new Date('2022-03-14'), sex: 'F', programType: 'PRE_K',
    },
    family: {
      id: 'fam_1', firstName: 'Ann', lastName: 'Alpha', phone: '5550100',
      email: 'ann@x.test', address: '1 Main St', city: 'Decatur', state: 'GA', zip: '30030',
      parent2FirstName: null, parent2LastName: null, parent2Phone: null,
      parent2WorkPhone: null, parent2Employer: null, parent2EmployerAddress: null,
    },
  }
}

describe('assembleApplicationData SSN decryption', () => {
  it('decrypts an encrypted preKSsn for PDF generation', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = assembleApplicationData(makeApp(encryptSsn('123-45-6789')) as any)
    expect(data.child.ssn).toBe('123-45-6789')
  })

  it('passes legacy plain-text and null values through', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(assembleApplicationData(makeApp('123-45-6789') as any).child.ssn).toBe('123-45-6789')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(assembleApplicationData(makeApp(null) as any).child.ssn).toBeNull()
  })
})
