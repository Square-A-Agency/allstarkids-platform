import { describe, it, expect } from 'vitest'
import { getDocumentSet } from '../generate-documents'

describe('getDocumentSet', () => {
  // ── Infant ────────────────────────────────────────────────────────────────
  it('INFANT gets forms 1-4 (enrollment, topical, no-liability, infant-feeding)', () => {
    const docs = getDocumentSet({ programType: 'INFANT', usesTransportation: false, hasSSN: true, needsExtendedDay: false })
    expect(docs).toContain('enrollment_form')
    expect(docs).toContain('authorization_topical')
    expect(docs).toContain('no_liability')
    expect(docs).toContain('infant_feeding')
  })

  it('INFANT does NOT get transportation or prek_child_reg', () => {
    const docs = getDocumentSet({ programType: 'INFANT', usesTransportation: true, hasSSN: true, needsExtendedDay: false })
    expect(docs).not.toContain('transportation')
    expect(docs).not.toContain('vehicle_emergency')
    expect(docs).not.toContain('prek_child_reg')
  })

  // ── Toddler / Preschool ───────────────────────────────────────────────────
  it('TODDLER gets forms 1-3 (no infant_feeding)', () => {
    const docs = getDocumentSet({ programType: 'TODDLER', usesTransportation: false, hasSSN: true, needsExtendedDay: false })
    expect(docs).toContain('enrollment_form')
    expect(docs).toContain('authorization_topical')
    expect(docs).toContain('no_liability')
    expect(docs).not.toContain('infant_feeding')
  })

  it('PRESCHOOL gets forms 1-3 (no infant_feeding)', () => {
    const docs = getDocumentSet({ programType: 'PRESCHOOL', usesTransportation: false, hasSSN: true, needsExtendedDay: false })
    expect(docs).toContain('enrollment_form')
    expect(docs).toContain('authorization_topical')
    expect(docs).toContain('no_liability')
    expect(docs).not.toContain('infant_feeding')
    expect(docs).not.toContain('prek_child_reg')
    expect(docs).not.toContain('transportation')
  })

  // ── Pre-K ─────────────────────────────────────────────────────────────────
  it('PRE_K gets prek_child_reg, topical, no-liability — not enrollment_form or infant_feeding', () => {
    const docs = getDocumentSet({ programType: 'PRE_K', usesTransportation: false, hasSSN: true, needsExtendedDay: false })
    expect(docs).toContain('prek_child_reg')
    expect(docs).toContain('authorization_topical')
    expect(docs).toContain('no_liability')
    expect(docs).not.toContain('enrollment_form')
    expect(docs).not.toContain('infant_feeding')
  })

  it('PRE_K gets transportation when usesTransportation is true', () => {
    const docs = getDocumentSet({ programType: 'PRE_K', usesTransportation: true, hasSSN: true, needsExtendedDay: false })
    expect(docs).toContain('transportation')
    expect(docs).toContain('vehicle_emergency')
  })

  it('PRE_K does NOT get transportation when usesTransportation is false', () => {
    const docs = getDocumentSet({ programType: 'PRE_K', usesTransportation: false, hasSSN: true, needsExtendedDay: false })
    expect(docs).not.toContain('transportation')
    expect(docs).not.toContain('vehicle_emergency')
  })

  // ── After School / Summer Camp ────────────────────────────────────────────
  it('AFTER_SCHOOL gets forms 1-3 (no prek_child_reg, no infant_feeding)', () => {
    const docs = getDocumentSet({ programType: 'AFTER_SCHOOL', usesTransportation: false, hasSSN: true, needsExtendedDay: false })
    expect(docs).toContain('enrollment_form')
    expect(docs).toContain('authorization_topical')
    expect(docs).toContain('no_liability')
    expect(docs).not.toContain('prek_child_reg')
    expect(docs).not.toContain('infant_feeding')
  })

  it('AFTER_SCHOOL gets transportation when usesTransportation is true', () => {
    const docs = getDocumentSet({ programType: 'AFTER_SCHOOL', usesTransportation: true, hasSSN: true, needsExtendedDay: false })
    expect(docs).toContain('transportation')
    expect(docs).toContain('vehicle_emergency')
  })

  it('SUMMER_CAMP_EAGLETS follows After School rules (no prek_child_reg)', () => {
    const docs = getDocumentSet({ programType: 'SUMMER_CAMP_EAGLETS', usesTransportation: false, hasSSN: true, needsExtendedDay: false })
    expect(docs).toContain('enrollment_form')
    expect(docs).not.toContain('prek_child_reg')
    expect(docs).not.toContain('infant_feeding')
  })

  // ── Conditional forms (all groups) ───────────────────────────────────────
  it('includes ssn_information when SSN not provided (any program)', () => {
    for (const programType of ['INFANT', 'TODDLER', 'PRESCHOOL', 'PRE_K', 'AFTER_SCHOOL']) {
      const docs = getDocumentSet({ programType, usesTransportation: false, hasSSN: false, needsExtendedDay: false })
      expect(docs).toContain('ssn_information')
    }
  })

  it('excludes ssn_information when SSN is provided', () => {
    const docs = getDocumentSet({ programType: 'PRE_K', usesTransportation: false, hasSSN: true, needsExtendedDay: false })
    expect(docs).not.toContain('ssn_information')
  })

  it('includes caps_referral when needsExtendedDay is true (any program)', () => {
    for (const programType of ['INFANT', 'TODDLER', 'PRE_K', 'AFTER_SCHOOL']) {
      const docs = getDocumentSet({ programType, usesTransportation: false, hasSSN: true, needsExtendedDay: true })
      expect(docs).toContain('caps_referral')
    }
  })

  it('excludes caps_referral when needsExtendedDay is false', () => {
    const docs = getDocumentSet({ programType: 'PRE_K', usesTransportation: false, hasSSN: true, needsExtendedDay: false })
    expect(docs).not.toContain('caps_referral')
  })
})
