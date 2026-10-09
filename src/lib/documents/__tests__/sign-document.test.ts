import { describe, it, expect, vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { PDFDocument, PDFName } from 'pdf-lib'
import { decodeSignaturePng, stampSignature, signedPathFor, SignatureError } from '../sign-document'

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
// 1x1 transparent PNG
const TINY_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
const TINY_PNG_DATA_URL = `data:image/png;base64,${TINY_PNG_B64}`

describe('decodeSignaturePng', () => {
  it('decodes a PNG data URL to bytes', () => {
    const bytes = decodeSignaturePng(TINY_PNG_DATA_URL)
    expect(Buffer.from(bytes.subarray(0, 8))).toEqual(PNG_MAGIC)
  })

  it('rejects non-strings, non-PNG prefixes, bad magic, and oversize payloads', () => {
    expect(() => decodeSignaturePng(undefined)).toThrow(SignatureError)
    expect(() => decodeSignaturePng('data:image/jpeg;base64,AAAA')).toThrow(SignatureError)
    expect(() => decodeSignaturePng('data:image/png;base64,' + Buffer.from('not a png').toString('base64'))).toThrow(SignatureError)
    const big = Buffer.concat([PNG_MAGIC, Buffer.alloc(200_001)]).toString('base64')
    expect(() => decodeSignaturePng('data:image/png;base64,' + big)).toThrow(SignatureError)
  })
})

describe('signedPathFor', () => {
  it('inserts .signed before .pdf', () => {
    expect(signedPathFor('documents/f/c/no_liability.pdf')).toBe('documents/f/c/no_liability.signed.pdf')
  })
})

describe('stampSignature', () => {
  const original = (t: string) => new Uint8Array(fs.readFileSync(path.join(process.cwd(), 'src/lib/documents/originals', `${t}.pdf`)))
  const png = decodeSignaturePng(TINY_PNG_DATA_URL)

  it('returns a PDF with the same page count and an image on each signature page', async () => {
    const out = await stampSignature({
      documentType: 'prek_child_reg', pdfBytes: original('prek_child_reg'), signaturePng: png,
      signedAt: new Date('2026-10-12T15:00:00Z'), parentName: 'Amara Johnson',
    })
    const doc = await PDFDocument.load(out)
    expect(doc.getPageCount()).toBe(3)
    for (const pageIndex of [0, 2]) {
      const page = doc.getPages()[pageIndex]
      const xobjects = page.node.Resources()?.lookup(PDFName.of('XObject'))
      expect(xobjects, `page ${pageIndex} should carry the signature image`).toBeTruthy()
    }
  })

  it('writes the printed name and dates on the no-liability form', async () => {
    const spy = vi.spyOn(await import('../fill-pdf'), 'fillPdf')
    await stampSignature({
      documentType: 'no_liability', pdfBytes: original('no_liability'), signaturePng: png,
      signedAt: new Date('2026-10-12T15:00:00Z'), parentName: 'Amara Johnson',
    })
    const fields = spy.mock.calls[0][1]
    expect(fields.filter((f) => f.type === 'image')).toHaveLength(1)
    expect(fields.filter((f) => f.type === 'text' && f.value === '10/12/2026')).toHaveLength(2)
    expect(fields.some((f) => f.type === 'text' && f.value === 'Amara Johnson')).toBe(true)
    spy.mockRestore()
  })

  it('refuses a non-signable document type', async () => {
    await expect(stampSignature({
      documentType: 'BIRTH_CERTIFICATE', pdfBytes: original('no_liability'), signaturePng: png,
      signedAt: new Date(), parentName: 'x',
    })).rejects.toThrow(/not signable/)
  })
})
