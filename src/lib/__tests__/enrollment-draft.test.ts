import { describe, it, expect } from 'vitest'
import { isWizardStateShape } from '../enrollment-draft'

const valid = { step: 2, familyInfo: { firstName: 'A' }, children: [] }

describe('isWizardStateShape', () => {
  it('accepts a well-formed wizard state', () => {
    expect(isWizardStateShape(valid)).toBe(true)
  })

  it('rejects null, primitives, and arrays', () => {
    expect(isWizardStateShape(null)).toBe(false)
    expect(isWizardStateShape('x')).toBe(false)
    expect(isWizardStateShape([valid])).toBe(false)
  })

  it('rejects a missing or out-of-range step', () => {
    expect(isWizardStateShape({ ...valid, step: undefined })).toBe(false)
    expect(isWizardStateShape({ ...valid, step: 0 })).toBe(false)
    expect(isWizardStateShape({ ...valid, step: 7 })).toBe(false)
  })

  it('rejects missing familyInfo or non-array children', () => {
    expect(isWizardStateShape({ step: 1, children: [] })).toBe(false)
    expect(isWizardStateShape({ step: 1, familyInfo: {}, children: 'no' })).toBe(false)
  })
})
