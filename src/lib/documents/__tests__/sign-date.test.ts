import { describe, it, expect } from 'vitest'
import { formatSignDate } from '../sign-date'

describe('formatSignDate', () => {
  it('formats as MM/DD/YYYY', () => {
    expect(formatSignDate(new Date('2026-10-12T15:00:00Z'))).toBe('10/12/2026')
  })

  it('uses Eastern time, so a UTC time just after midnight is the previous day', () => {
    // 03:30 UTC on Oct 13 is 23:30 EDT on Oct 12
    expect(formatSignDate(new Date('2026-10-13T03:30:00Z'))).toBe('10/12/2026')
  })

  it('zero-pads month and day', () => {
    expect(formatSignDate(new Date('2026-01-05T12:00:00Z'))).toBe('01/05/2026')
  })
})
