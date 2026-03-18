import { describe, it, expect } from 'vitest'
import { assembleApplicationData } from '../assemble-data'

const mockApplication = {
  id: 'app-1',
  familyId: 'fam-1',
  track: 'UNIVERSAL' as const,
  livingArrangement: 'BOTH_PARENTS' as const,
  legalGuardian: 'BOTH_PARENTS' as const,
  authorizedPickups: [{ name: 'Jane Doe', address: '123 St', phone: '555-0001', relationship: 'Aunt', relationshipToParent: 'Sister' }],
  emergencyContacts: [{ name: 'Bob Smith', phone: '555-0002', relationship: 'Uncle' }],
  doctorName: 'Dr. Jones',
  doctorPhone: '555-0003',
  clinicName: null,
  currentSchool: null,
  specialNeeds: null,
  specialAccommodations: null,
  medications: null,
  allergies: null,
  topicalPreparations: { babyWipes: true, bandaids: false, neosporin: false, bactine: false, sunscreen: false, insectRepellent: false, nonRxOintment: false, babyPowder: false, other: false },
  enrollmentStartMonth: 'September',
  enrollmentEndMonth: 'May',
  daysOfWeek: ['Monday', 'Tuesday'],
  startTime: '7:00 AM',
  endTime: '5:00 PM',
  mealPlan: ['Breakfast', 'Lunch'],
  usesTransportation: false,
  transportPickupLocation: null,
  transportPickupTime: null,
  transportDeliveryLocation: null,
  transportDeliveryTime: null,
  transportDays: [],
  transportAuthorizedPerson: null,
  transportFallbackProcedure: null,
  infantFeedingPlan: null,
  preKSsn: null,
  preKCounty: null,
  preKPreviousSchool: null,
  preKLastDatePreviousSchool: null,
  preKLastHealthScreening: null,
  preKSsnNotProvidedReason: null,
  needsExtendedDay: null,
  capsCaseId: null,
  child: {
    id: 'child-1',
    firstName: 'Emma',
    lastName: 'Smith',
    middleName: null,
    dateOfBirth: new Date('2022-06-15T00:00:00Z'), // UTC midnight — matches Prisma DateTime storage
    sex: 'F',
    programType: 'PRESCHOOL' as const,
    nameSuffix: null,
    preKSsn: null,
    preKCounty: null,
  },
  family: {
    id: 'fam-1',
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@example.com',
    phone: '555-1234',
    address: '456 Main St',
    city: 'Decatur',
    state: 'GA',
    zip: '30035',
    parent2FirstName: null,
    parent2LastName: null,
    parent2Email: null,
    parent2Phone: null,
    parent2WorkPhone: null,
    parent2Employer: null,
    parent2EmployerAddress: null,
    parent2Address: null,
  },
}

describe('assembleApplicationData', () => {
  it('returns correct applicationId, familyId, childId', () => {
    const data = assembleApplicationData(mockApplication as any)
    expect(data.applicationId).toBe('app-1')
    expect(data.familyId).toBe('fam-1')
    expect(data.childId).toBe('child-1')
  })

  it('formats dateOfBirth as MM/DD/YYYY', () => {
    const data = assembleApplicationData(mockApplication as any)
    expect(data.child.dateOfBirth).toBe('06/15/2022')
  })

  it('maps family fields to parent1', () => {
    const data = assembleApplicationData(mockApplication as any)
    expect(data.parent1.firstName).toBe('Alice')
    expect(data.parent1.email).toBe('alice@example.com')
    expect(data.parent1.city).toBe('Decatur')
  })

  it('maps authorized pickups correctly', () => {
    const data = assembleApplicationData(mockApplication as any)
    expect(data.pickups).toHaveLength(1)
    expect(data.pickups[0].name).toBe('Jane Doe')
  })

  it('maps topical preparations with defaults for missing keys', () => {
    const data = assembleApplicationData(mockApplication as any)
    expect(data.topical.babyWipes).toBe(true)
    expect(data.topical.bandaids).toBe(false)
  })

  it('sets transport.uses to false when usesTransportation is false', () => {
    const data = assembleApplicationData(mockApplication as any)
    expect(data.transport.uses).toBe(false)
  })
})
