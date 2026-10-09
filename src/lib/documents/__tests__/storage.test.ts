import { describe, it, expect } from 'vitest'
import { sha256Hex, historyPathFor } from '../storage'

describe('sha256Hex', () => {
  it('hashes bytes to lowercase hex', () => {
    expect(sha256Hex(new Uint8Array(Buffer.from('abc')))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    )
  })
})

describe('historyPathFor', () => {
  it('moves a signed copy under history with a filesystem-safe timestamp', () => {
    const at = new Date('2026-10-12T14:05:09.000Z')
    expect(historyPathFor('documents/fam/child/no_liability.signed.pdf', at)).toBe(
      'documents/fam/child/history/no_liability.signed.2026-10-12T14-05-09.pdf'
    )
  })
})
