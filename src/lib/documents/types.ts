import type { ProgramType, LivingArrangement, ApplicationTrack } from '@/generated/prisma'

export type FieldEntry =
  | { type: 'text';     page: number; x: number; y: number; value: string; fontSize?: number }
  | { type: 'checkbox'; page: number; x: number; y: number; checked: boolean }

export type InfantFeedingPlan = {
  feedingMethod?: string
  formulaType?: string
  formulaAmount?: string
  feedingTimes?: string
  pacifierUse?: boolean
  solidFoodsReady?: boolean
  foodLikes?: string
  foodDislikes?: string
  allergies?: string
}

export type ApplicationData = {
  applicationId: string
  familyId: string
  childId: string
  child: {
    firstName: string
    lastName: string
    middleName: string | null
    dateOfBirth: string        // pre-formatted MM/DD/YYYY
    sex: string                // 'M' | 'F'
    programType: ProgramType
    ssn: string | null
    county: string | null
  }
  parent1: {
    firstName: string
    lastName: string
    phone: string
    workPhone: string | null
    address: string
    city: string
    state: string
    zip: string
    employer: string | null
    employerAddress: string | null
    email: string
  }
  parent2: {
    firstName: string | null
    lastName: string | null
    phone: string | null
    workPhone: string | null
    address: string | null
    employer: string | null
    employerAddress: string | null
  }
  track: ApplicationTrack
  livingArrangement: LivingArrangement | null
  legalGuardian: LivingArrangement | null
  pickups: Array<{ name: string; address: string; phone: string; relationship: string; relationshipToParent: string }>
  emergencyContacts: Array<{ name: string; phone: string; relationship: string }>
  doctor: { name: string | null; phone: string | null; clinicName: string | null }
  currentSchool: string | null
  specialNeeds: string | null
  specialAccommodations: string | null
  allergies: string | null
  medications: string | null
  topical: {
    babyWipes: boolean; bandaids: boolean; neosporin: boolean; bactine: boolean
    sunscreen: boolean; insectRepellent: boolean; nonRxOintment: boolean; babyPowder: boolean; other: boolean
  }
  schedule: {
    enrollmentStartMonth: string | null
    enrollmentEndMonth: string | null
    daysOfWeek: string[]
    startTime: string | null
    endTime: string | null
    mealPlan: string[]
  }
  transport: {
    uses: boolean
    pickupLocation: string | null
    pickupTime: string | null
    deliveryLocation: string | null
    deliveryTime: string | null
    days: string[]
    authorizedPerson: string | null
    fallbackProcedure: string | null
  }
  infant: { feedingPlan: InfantFeedingPlan | null }
  preK: {
    previousSchool: string | null
    lastDatePreviousSchool: string | null
    lastHealthScreening: string | null
    ssnNotProvidedReason: string | null
    needsExtendedDay: boolean | null
    capsCaseId: string | null
  }
}
