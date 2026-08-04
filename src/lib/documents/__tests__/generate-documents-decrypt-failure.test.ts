import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { randomBytes } from 'node:crypto'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    enrollmentApplication: { findUniqueOrThrow: vi.fn() },
    applicationDocument: { upsert: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'
import { encryptSsn } from '@/lib/ssn-crypto'
import { generateApplicationDocuments, generateSingleDocument } from '../generate-documents'

const mockFind = prisma.enrollmentApplication.findUniqueOrThrow as ReturnType<typeof vi.fn>
const mockUpsert = prisma.applicationDocument.upsert as ReturnType<typeof vi.fn>

let encryptedSsn: string

beforeAll(() => {
  process.env.SSN_ENCRYPTION_KEY = randomBytes(32).toString('base64')
  encryptedSsn = encryptSsn('123-45-6789')
})

beforeEach(() => {
  vi.clearAllMocks()
})

function makeApplication() {
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
    preKSsn: encryptedSsn, preKCounty: null, preKPreviousSchool: null,
    preKLastDatePreviousSchool: null, preKLastHealthScreening: null,
    preKSsnNotProvidedReason: null, needsExtendedDay: false, capsCaseId: null,
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

describe('generateApplicationDocuments — decrypt failure containment', () => {
  it('records ERROR rows instead of throwing when SSN_ENCRYPTION_KEY is missing', async () => {
    const savedKey = process.env.SSN_ENCRYPTION_KEY
    delete process.env.SSN_ENCRYPTION_KEY
    try {
      mockFind.mockResolvedValue(makeApplication())
      mockUpsert.mockResolvedValue({})

      await expect(generateApplicationDocuments('app_1')).resolves.toBeUndefined()

      expect(mockUpsert).toHaveBeenCalled()
      for (const call of mockUpsert.mock.calls) {
        const [args] = call
        expect(args.create.generationStatus).toBe('ERROR')
        expect(args.create.generationError).toBeTruthy()
        expect(args.update.generationStatus).toBe('ERROR')
      }
      // PRE_K, no transportation, hasSSN true, no extended day -> 3 doc types
      expect(mockUpsert).toHaveBeenCalledTimes(3)
    } finally {
      process.env.SSN_ENCRYPTION_KEY = savedKey
    }
  })
})

describe('generateSingleDocument — decrypt failure containment', () => {
  it('records an ERROR row instead of throwing when SSN_ENCRYPTION_KEY is missing', async () => {
    const savedKey = process.env.SSN_ENCRYPTION_KEY
    delete process.env.SSN_ENCRYPTION_KEY
    try {
      mockFind.mockResolvedValue(makeApplication())
      mockUpsert.mockResolvedValue({})

      await expect(generateSingleDocument('app_1', 'prek_child_reg')).resolves.toBeUndefined()

      expect(mockUpsert).toHaveBeenCalledTimes(1)
      const [args] = mockUpsert.mock.calls[0]
      expect(args.create.generationStatus).toBe('ERROR')
      expect(args.create.generationError).toBeTruthy()
    } finally {
      process.env.SSN_ENCRYPTION_KEY = savedKey
    }
  })
})
