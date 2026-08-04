import type { ApplicationData, InfantFeedingPlan } from './types'

/** Whole years old on `at`, from a pre-formatted MM/DD/YYYY date of birth. */
export function ageFromDob(dob: string, at: Date): number {
  const [month, day, year] = dob.split('/').map(Number)
  let age = at.getFullYear() - year
  if (at.getMonth() + 1 < month || (at.getMonth() + 1 === month && at.getDate() < day)) age--
  return age
}

type PrismaApplication = {
  id: string
  familyId: string
  track: string
  livingArrangement: string | null
  legalGuardian: string | null
  authorizedPickups: unknown
  emergencyContacts: unknown
  doctorName: string | null
  doctorPhone: string | null
  clinicName: string | null
  currentSchool: string | null
  specialNeeds: string | null
  specialAccommodations: string | null
  medications: string | null
  allergies: string | null
  topicalPreparations: unknown
  enrollmentStartMonth: string | null
  enrollmentEndMonth: string | null
  daysOfWeek: string[]
  startTime: string | null
  endTime: string | null
  mealPlan: string[]
  usesTransportation: boolean
  transportPickupLocation: string | null
  transportPickupTime: string | null
  transportDeliveryLocation: string | null
  transportDeliveryTime: string | null
  transportDays: string[]
  transportAuthorizedPerson: string | null
  transportFallbackProcedure: string | null
  infantFeedingPlan: unknown
  preKSsn: string | null
  preKCounty: string | null
  preKPreviousSchool: string | null
  preKLastDatePreviousSchool: string | null
  preKLastHealthScreening: string | null
  preKSsnNotProvidedReason: string | null
  needsExtendedDay: boolean | null
  capsCaseId: string | null
  child: {
    id: string
    firstName: string
    lastName: string
    middleName: string | null
    dateOfBirth: Date
    sex: string
    programType: string
  }
  family: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    zip: string
    parent2FirstName: string | null
    parent2LastName: string | null
    parent2Email: string | null
    parent2Phone: string | null
    parent2WorkPhone: string | null
    parent2Employer: string | null
    parent2EmployerAddress: string | null
    parent2Address: string | null
  }
}

function formatDate(date: Date): string {
  // Use UTC accessors — Prisma stores DateTime as UTC midnight; local accessors
  // would roll back one day in timezones behind UTC (e.g. America/New_York).
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  const yyyy = date.getUTCFullYear()
  return `${mm}/${dd}/${yyyy}`
}

function asTopical(raw: unknown): ApplicationData['topical'] {
  const t = (raw as Record<string, boolean>) ?? {}
  return {
    babyWipes: t.babyWipes ?? false,
    bandaids: t.bandaids ?? false,
    neosporin: t.neosporin ?? false,
    bactine: t.bactine ?? false,
    sunscreen: t.sunscreen ?? false,
    insectRepellent: t.insectRepellent ?? false,
    nonRxOintment: t.nonRxOintment ?? false,
    babyPowder: t.babyPowder ?? false,
    other: t.other ?? false,
  }
}

export function assembleApplicationData(app: PrismaApplication): ApplicationData {
  return {
    applicationId: app.id,
    familyId: app.familyId,
    childId: app.child.id,
    child: {
      firstName: app.child.firstName,
      lastName: app.child.lastName,
      middleName: app.child.middleName,
      dateOfBirth: formatDate(app.child.dateOfBirth),
      sex: app.child.sex,
      programType: app.child.programType as ApplicationData['child']['programType'],
      ssn: app.preKSsn,
      county: app.preKCounty,
    },
    parent1: {
      firstName: app.family.firstName,
      lastName: app.family.lastName,
      phone: app.family.phone,
      workPhone: null,       // Family schema has no workPhone for parent1 — gap to address in future schema update
      address: app.family.address,
      city: app.family.city,
      state: app.family.state,
      zip: app.family.zip,
      employer: null,        // Family schema has no employer for parent1 — gap to address in future schema update
      employerAddress: null, // Family schema has no employerAddress for parent1 — gap to address in future schema update
      email: app.family.email,
    },
    parent2: {
      firstName: app.family.parent2FirstName,
      lastName: app.family.parent2LastName,
      phone: app.family.parent2Phone,
      workPhone: app.family.parent2WorkPhone,
      address: app.family.parent2Address,
      employer: app.family.parent2Employer,
      employerAddress: app.family.parent2EmployerAddress,
    },
    track: app.track as ApplicationData['track'],
    livingArrangement: app.livingArrangement as ApplicationData['livingArrangement'],
    legalGuardian: app.legalGuardian as ApplicationData['legalGuardian'],
    pickups: (app.authorizedPickups as ApplicationData['pickups']) ?? [],
    emergencyContacts: (app.emergencyContacts as ApplicationData['emergencyContacts']) ?? [],
    doctor: {
      name: app.doctorName,
      phone: app.doctorPhone,
      clinicName: app.clinicName,
    },
    currentSchool: app.currentSchool,
    specialNeeds: app.specialNeeds,
    specialAccommodations: app.specialAccommodations,
    allergies: app.allergies,
    medications: app.medications,
    topical: asTopical(app.topicalPreparations),
    schedule: {
      enrollmentStartMonth: app.enrollmentStartMonth,
      enrollmentEndMonth: app.enrollmentEndMonth,
      daysOfWeek: app.daysOfWeek,
      startTime: app.startTime,
      endTime: app.endTime,
      mealPlan: app.mealPlan,
    },
    transport: {
      uses: app.usesTransportation,
      pickupLocation: app.transportPickupLocation,
      pickupTime: app.transportPickupTime,
      deliveryLocation: app.transportDeliveryLocation,
      deliveryTime: app.transportDeliveryTime,
      days: app.transportDays,
      authorizedPerson: app.transportAuthorizedPerson,
      fallbackProcedure: app.transportFallbackProcedure,
    },
    infant: {
      feedingPlan: app.infantFeedingPlan as InfantFeedingPlan | null,
    },
    preK: {
      previousSchool: app.preKPreviousSchool,
      lastDatePreviousSchool: app.preKLastDatePreviousSchool,
      lastHealthScreening: app.preKLastHealthScreening,
      ssnNotProvidedReason: app.preKSsnNotProvidedReason,
      needsExtendedDay: app.needsExtendedDay,
      capsCaseId: app.capsCaseId,
    },
  }
}
