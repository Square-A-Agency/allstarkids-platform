export type PreKDocument = {
  documentType: string;
  // "BIRTH_CERTIFICATE" | "SSN_CARD" | "MEDICAID_CARD" | "PARENT_DL"
  // | "PROOF_OF_RESIDENCY" | "PEACH_CARE_CARD" | "FORM_3300" | "FORM_3232"
  fileName: string;
  fileUrl: string; // Supabase Storage URL after upload
  fileSize?: number;
  mimeType?: string;
};

export type FamilyInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  parent2FirstName: string;
  parent2LastName: string;
  parent2Email: string;
  parent2Phone: string;
  parent2WorkPhone: string;
  parent2Employer: string;
  parent2EmployerAddress: string;
};

export type EmergencyContact = {
  name: string;
  phone: string;
  relationship: string;
};

export type AuthorizedPickup = {
  name: string;
  address: string;
  phone: string;
  relationship: string;
};

export type InfantFeedingPlan = {
  feedingMethod: string; // "Bottle" | "Self-feed" | "Both"
  formulaType: string;
  formulaAmount: string;
  formulaTimes: string;
  usesPacifier: boolean;
  solidFoodsReady: boolean;
  foodLikes: string;
  foodDislikes: string;
  foodAllergies: string;
};

export type TopicalPreparations = {
  babyWipes: boolean;
  bandaids: boolean;
  neosporin: boolean;
  bactine: boolean;
  sunscreen: boolean;
  insectRepellent: boolean;
  nonRxOintment: boolean;
  babyPowder: boolean;
  other: string;
};

export type ChildEntry = {
  tempId: string; // client-side only, for list management
  firstName: string;
  lastName: string;
  middleName: string;
  nameSuffix: string;
  dateOfBirth: string; // ISO date string
  sex: string;
  programType: string;
  track: string; // "PRE_K" | "UNIVERSAL"

  // Medical (Step 3)
  doctorName?: string;
  doctorPhone?: string;
  specialNeeds?: string;
  specialAccommodations?: string;
  medications?: string;
  allergies?: string;
  currentSchool?: string;
  livingArrangement?: string; // "BOTH_PARENTS" | "MOTHER" | "FATHER" | "OTHER"
  legalGuardian?: string;
  emergencyContacts?: EmergencyContact[];
  authorizedPickups?: AuthorizedPickup[];
  infantFeedingPlan?: InfantFeedingPlan; // only for INFANT and TODDLER programType

  // Pre-K specific fields (Step 4, only for track === "PRE_K")
  preKSsn?: string;
  preKCounty?: string;
  preKPreviousSchool?: string;
  preKLastDatePreviousSchool?: string;
  preKLastHealthScreening?: string; // date string
  preKDecalPhotoRelease?: boolean;
  preKDecalGeneralRelease?: boolean;
  preKSsnNotProvided?: boolean;
  preKSsnNotProvidedReason?: string;
  preKDocuments?: PreKDocument[];

  // Agreements (Step 4)
  enrollmentStartMonth?: string;
  enrollmentEndMonth?: string;
  daysOfWeek?: string[];
  startTime?: string;
  endTime?: string;
  mealPlan?: string[];
  topicalPreparations?: TopicalPreparations;
  usesTransportation?: boolean;
  transportPickupLocation?: string;
  transportPickupTime?: string;
  transportDeliveryLocation?: string;
  transportDeliveryTime?: string;
  transportDays?: string[];
  transportAuthorizedPerson?: string;
  transportFallbackProcedure?: string;
  noLiabilityAcknowledged?: boolean;
};

export type EnrollmentWizardState = {
  step: number;
  familyInfo: FamilyInfo;
  children: ChildEntry[];
};
