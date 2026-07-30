import { describe, it, expect } from 'vitest'
import { validateStaffApplicationPayload, VALID_STAFF_STATUSES, STAFF_ROLES } from '../careers'

const validPayload = {
  role: 'Teacher (1 Year Olds)',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  phone: '404-555-0100',
  yearsExp: 3,
  availability: 'Mon–Fri, 6am–3pm',
  refOneName: 'Alice Brown',
  refOnePhone: '404-555-0101',
  refTwoName: 'Bob Davis',
  refTwoPhone: '404-555-0102',
  coverNote: 'I love working with children.',
}

describe('validateStaffApplicationPayload', () => {
  it('returns null for a valid payload', () => {
    expect(validateStaffApplicationPayload(validPayload)).toBeNull()
  })

  it('returns error when required field is missing', () => {
    const { firstName, ...rest } = validPayload
    expect(validateStaffApplicationPayload(rest)).toMatch(/firstName/)
  })

  it('returns error for invalid role', () => {
    expect(validateStaffApplicationPayload({ ...validPayload, role: 'Janitor' })).toMatch(/role/)
  })

  it('returns error when yearsExp is negative', () => {
    expect(validateStaffApplicationPayload({ ...validPayload, yearsExp: -1 })).toMatch(/yearsExp/)
  })

  it('returns error for invalid email format', () => {
    expect(validateStaffApplicationPayload({ ...validPayload, email: 'not-an-email' })).toMatch(/email/)
  })

  it('returns error when required field is whitespace only', () => {
    expect(validateStaffApplicationPayload({ ...validPayload, firstName: '   ' })).toMatch(/firstName/)
  })

  it('returns error when yearsExp is a float', () => {
    expect(validateStaffApplicationPayload({ ...validPayload, yearsExp: 1.5 })).toMatch(/yearsExp/)
  })

  it('returns error for NaN yearsExp', () => {
    const payload = { ...validPayload, yearsExp: NaN }
    expect(validateStaffApplicationPayload(payload)).not.toBeNull()
  })
})

describe('VALID_STAFF_STATUSES', () => {
  it('contains all expected statuses', () => {
    expect(VALID_STAFF_STATUSES).toContain('PENDING')
    expect(VALID_STAFF_STATUSES).toContain('UNDER_REVIEW')
    expect(VALID_STAFF_STATUSES).toContain('INTERVIEW_SCHEDULED')
    expect(VALID_STAFF_STATUSES).toContain('HIRED')
    expect(VALID_STAFF_STATUSES).toContain('REJECTED')
  })
})

describe('STAFF_ROLES', () => {
  it('contains all three roles', () => {
    expect(STAFF_ROLES).toContain('Teacher (1 Year Olds)')
    expect(STAFF_ROLES).toContain('Teacher (2 Year Olds)')
    expect(STAFF_ROLES).toContain('Bus Driver')
  })
})
