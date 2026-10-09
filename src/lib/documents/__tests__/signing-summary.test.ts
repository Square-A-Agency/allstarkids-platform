import { describe, it, expect } from 'vitest'
import { signingSummary } from '../signing-summary'

const ok = (documentType: string, signedAt: Date | null = null) => ({
  documentType, generationStatus: 'SUCCESS', fileUrl: `documents/f/c/${documentType}.pdf`, signedAt,
})

describe('signingSummary', () => {
  it('counts only successfully generated signable documents', () => {
    const s = signingSummary([
      ok('enrollment_form', new Date()),
      ok('no_liability'),
      { documentType: 'vehicle_emergency', generationStatus: 'ERROR', fileUrl: '', signedAt: null },
      ok('BIRTH_CERTIFICATE'), // parent upload, never signable
    ])
    expect(s).toEqual({ signable: 2, signed: 1, complete: false })
  })

  it('is complete only when every signable document is signed', () => {
    expect(signingSummary([ok('enrollment_form', new Date()), ok('no_liability', new Date())]).complete).toBe(true)
  })

  it('is never complete with zero signable documents', () => {
    expect(signingSummary([]).complete).toBe(false)
    expect(signingSummary([{ documentType: 'enrollment_form', generationStatus: 'ERROR', fileUrl: '', signedAt: null }]).complete).toBe(false)
  })

  it('accepts ISO strings for signedAt', () => {
    expect(signingSummary([ok('enrollment_form', '2026-10-12T00:00:00Z' as unknown as Date)]).signed).toBe(1)
  })
})
