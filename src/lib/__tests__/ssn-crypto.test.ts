import { describe, it, expect, beforeAll } from 'vitest'
import { randomBytes } from 'node:crypto'
import { encryptSsn, decryptSsn, maskSsn } from '../ssn-crypto'

beforeAll(() => {
  process.env.SSN_ENCRYPTION_KEY = randomBytes(32).toString('base64')
})

describe('encryptSsn / decryptSsn', () => {
  it('round-trips a value', () => {
    const ct = encryptSsn('123-45-6789')
    expect(ct).toMatch(/^enc:v1:/)
    expect(ct).not.toContain('6789')
    expect(decryptSsn(ct)).toBe('123-45-6789')
  })

  it('produces a different ciphertext each call (fresh IV)', () => {
    expect(encryptSsn('123-45-6789')).not.toBe(encryptSsn('123-45-6789'))
  })

  it('is idempotent: encrypting an already-encrypted value returns it unchanged', () => {
    const ct = encryptSsn('123-45-6789')
    expect(encryptSsn(ct)).toBe(ct)
  })

  it('passes empty and legacy plain-text values through decryptSsn unchanged', () => {
    expect(encryptSsn('')).toBe('')
    expect(decryptSsn('')).toBe('')
    expect(decryptSsn('123-45-6789')).toBe('123-45-6789')
  })

  it('throws on a corrupted enc:v1: payload', () => {
    expect(() => decryptSsn('enc:v1:AAAA:BBBB:CCCC')).toThrow()
  })

  it('throws on a truncated auth tag', () => {
    const ct = encryptSsn('123-45-6789')
    const [iv, tag, payload] = ct.slice('enc:v1:'.length).split(':')
    const truncatedTag = Buffer.from(tag, 'base64').subarray(0, 4).toString('base64')
    const tampered = `enc:v1:${iv}:${truncatedTag}:${payload}`
    expect(() => decryptSsn(tampered)).toThrow()
  })
})

describe('maskSsn', () => {
  it('shows only the last four digits', () => {
    expect(maskSsn('123-45-6789')).toBe('***-**-6789')
    expect(maskSsn('123456789')).toBe('***-**-6789')
  })

  it('returns a full mask for values shorter than four digits', () => {
    expect(maskSsn('12')).toBe('***-**-****')
  })
})
