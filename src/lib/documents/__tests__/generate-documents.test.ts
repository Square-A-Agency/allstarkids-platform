import { describe, it, expect } from 'vitest'
import { getDocumentSet } from '../generate-documents'

describe('getDocumentSet', () => {
  it('universal track always includes enrollment form, topical, no-liability', () => {
    const docs = getDocumentSet({ track: 'UNIVERSAL', programType: 'PRESCHOOL', usesTransportation: false, hasSSN: true, needsExtendedDay: false })
    expect(docs).toContain('enrollment_form')
    expect(docs).toContain('authorization_topical')
    expect(docs).toContain('no_liability')
  })

  it('universal track does NOT include infant feeding for non-infant programs', () => {
    const docs = getDocumentSet({ track: 'UNIVERSAL', programType: 'PRESCHOOL', usesTransportation: false, hasSSN: true, needsExtendedDay: false })
    expect(docs).not.toContain('infant_feeding')
  })

  it('includes infant feeding for INFANT program', () => {
    const docs = getDocumentSet({ track: 'UNIVERSAL', programType: 'INFANT', usesTransportation: false, hasSSN: true, needsExtendedDay: false })
    expect(docs).toContain('infant_feeding')
  })

  it('includes infant feeding for TODDLER program', () => {
    const docs = getDocumentSet({ track: 'UNIVERSAL', programType: 'TODDLER', usesTransportation: false, hasSSN: true, needsExtendedDay: false })
    expect(docs).toContain('infant_feeding')
  })

  it('includes transportation + vehicle_emergency when usesTransportation is true', () => {
    const docs = getDocumentSet({ track: 'UNIVERSAL', programType: 'PRESCHOOL', usesTransportation: true, hasSSN: true, needsExtendedDay: false })
    expect(docs).toContain('transportation')
    expect(docs).toContain('vehicle_emergency')
  })

  it('pre-k track uses prek_child_reg, not enrollment_form', () => {
    const docs = getDocumentSet({ track: 'PRE_K', programType: 'PRE_K', usesTransportation: false, hasSSN: true, needsExtendedDay: false })
    expect(docs).toContain('prek_child_reg')
    expect(docs).not.toContain('enrollment_form')
    expect(docs).not.toContain('infant_feeding')
  })

  it('pre-k includes ssn_information when SSN not provided', () => {
    const docs = getDocumentSet({ track: 'PRE_K', programType: 'PRE_K', usesTransportation: false, hasSSN: false, needsExtendedDay: false })
    expect(docs).toContain('ssn_information')
  })

  it('pre-k does NOT include ssn_information when SSN is provided', () => {
    const docs = getDocumentSet({ track: 'PRE_K', programType: 'PRE_K', usesTransportation: false, hasSSN: true, needsExtendedDay: false })
    expect(docs).not.toContain('ssn_information')
  })

  it('pre-k includes caps_referral when needsExtendedDay is true', () => {
    const docs = getDocumentSet({ track: 'PRE_K', programType: 'PRE_K', usesTransportation: false, hasSSN: true, needsExtendedDay: true })
    expect(docs).toContain('caps_referral')
  })
})
