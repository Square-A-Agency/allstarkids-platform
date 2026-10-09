import { isSignableDocType } from './signature-lines'

export type SummaryDoc = {
  documentType: string
  generationStatus: string
  fileUrl: string
  signedAt: Date | string | null
}

export type SigningSummary = { signable: number; signed: number; complete: boolean }

/**
 * Signable = generated successfully AND one of the nine DECAL types.
 * Parent uploads (birth certificate etc.) and failed generations never count.
 * Complete requires at least one signable document, so an application whose
 * generation all failed is never reported as signed.
 */
export function signingSummary(docs: SummaryDoc[]): SigningSummary {
  const signable = docs.filter(
    (d) => d.generationStatus === 'SUCCESS' && !!d.fileUrl && isSignableDocType(d.documentType)
  )
  const signed = signable.filter((d) => !!d.signedAt)
  return {
    signable: signable.length,
    signed: signed.length,
    complete: signable.length > 0 && signed.length === signable.length,
  }
}
