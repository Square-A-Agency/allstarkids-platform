import type { SignableDocType } from './signature-lines'

export const DOCUMENT_LABELS: Record<SignableDocType, string> = {
  enrollment_form: 'Enrollment Form',
  authorization_topical: 'Authorization for Topical Preparations',
  no_liability: 'No Liability Agreement',
  infant_feeding: 'Infant Feeding Plan',
  transportation: 'Transportation Agreement',
  vehicle_emergency: 'Vehicle Emergency Card',
  prek_child_reg: 'Pre-K Child Registration',
  ssn_information: 'SSN Information',
  caps_referral: 'CAPS Referral',
}

export function documentLabel(t: string): string {
  return (DOCUMENT_LABELS as Record<string, string>)[t] ?? t.replace(/_/g, ' ')
}
