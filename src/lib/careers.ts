export const STAFF_ROLES = [
  'Teacher (1 Year Olds)',
  'Teacher (2 Year Olds)',
  'Bus Driver',
] as const

export type StaffRole = typeof STAFF_ROLES[number]

export const VALID_STAFF_STATUSES = [
  'PENDING',
  'UNDER_REVIEW',
  'INTERVIEW_SCHEDULED',
  'HIRED',
  'REJECTED',
] as const

const REQUIRED_FIELDS = [
  'role', 'firstName', 'lastName', 'email', 'phone',
  'yearsExp', 'availability', 'refOneName', 'refOnePhone',
  'refTwoName', 'refTwoPhone', 'coverNote',
] as const

export function validateStaffApplicationPayload(payload: Record<string, unknown>): string | null {
  for (const field of REQUIRED_FIELDS) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      return `Missing required field: ${field}`
    }
  }

  if (!STAFF_ROLES.includes(payload.role as StaffRole)) {
    return `Invalid role: must be one of ${STAFF_ROLES.join(', ')}`
  }

  if (typeof payload.yearsExp !== 'number' || payload.yearsExp < 0) {
    return 'Invalid yearsExp: must be a non-negative number'
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (typeof payload.email !== 'string' || !emailRegex.test(payload.email)) {
    return 'Invalid email format'
  }

  return null
}
