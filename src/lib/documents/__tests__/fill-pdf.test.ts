import { describe, it, expect } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { fillPdf } from '../fill-pdf'
import type { FieldEntry } from '../types'

async function makeBlankPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.addPage([612, 792]) // letter size
  return doc.save()
}

describe('fillPdf', () => {
  it('returns a Uint8Array', async () => {
    const pdfBytes = await makeBlankPdf()
    const fields: FieldEntry[] = []
    const result = await fillPdf(pdfBytes, fields)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })

  it('handles empty field list without error', async () => {
    const pdfBytes = await makeBlankPdf()
    const result = await fillPdf(pdfBytes, [])
    expect(result).toBeInstanceOf(Uint8Array)
  })

  it('handles text field entry without error', async () => {
    const pdfBytes = await makeBlankPdf()
    const fields: FieldEntry[] = [
      { type: 'text', page: 0, x: 100, y: 100, value: 'Hello' },
    ]
    const result = await fillPdf(pdfBytes, fields)
    expect(result).toBeInstanceOf(Uint8Array)
  })

  it('handles checkbox field entry without error', async () => {
    const pdfBytes = await makeBlankPdf()
    const fields: FieldEntry[] = [
      { type: 'checkbox', page: 0, x: 100, y: 100, checked: true },
      { type: 'checkbox', page: 0, x: 200, y: 100, checked: false },
    ]
    const result = await fillPdf(pdfBytes, fields)
    expect(result).toBeInstanceOf(Uint8Array)
  })

  it('skips fields targeting a page that does not exist', async () => {
    const pdfBytes = await makeBlankPdf()
    const fields: FieldEntry[] = [
      { type: 'text', page: 99, x: 100, y: 100, value: 'nope' },
    ]
    await expect(fillPdf(pdfBytes, fields)).resolves.toBeInstanceOf(Uint8Array)
  })
})
