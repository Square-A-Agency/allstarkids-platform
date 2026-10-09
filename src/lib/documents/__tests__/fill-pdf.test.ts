import { describe, it, expect } from 'vitest'
import { inflateSync } from 'zlib'
import { PDFArray, PDFDocument, PDFName, PDFRawStream } from 'pdf-lib'
import { fillPdf, normalizeFields } from '../fill-pdf'
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

// Builds a minimal opaque red RGBA PNG (pdf-lib cannot create PNGs).
async function makeTestPng(width: number, height: number): Promise<Uint8Array> {
  const { deflateSync } = await import('zlib')
  const raw: number[] = []
  for (let y = 0; y < height; y++) {
    raw.push(0) // filter byte
    for (let x = 0; x < width; x++) raw.push(255, 0, 0, 255)
  }
  const crc = (buf: Buffer) => {
    let c = ~0
    for (const b of buf) {
      c ^= b
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
    }
    return (~c >>> 0)
  }
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type), data])
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td))
    return Buffer.concat([len, td, c])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  return new Uint8Array(Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.from(raw))),
    chunk('IEND', Buffer.alloc(0)),
  ]))
}

// pdf-lib stores page content as an array of Flate-compressed streams; decode and join them.
function decodeContent(doc: PDFDocument): string {
  const contents = doc.context.lookup(doc.getPages()[0].node.get(PDFName.of('Contents')))
  const refs = contents instanceof PDFArray ? contents.asArray() : [contents]
  return refs
    .map((ref) => {
      const stream = doc.context.lookup(ref) as PDFRawStream
      return inflateSync(Buffer.from(stream.contents)).toString('latin1')
    })
    .join('\n')
}

describe('fillPdf image fields', () => {
  it('embeds a PNG image field without error and the output contains an image XObject', async () => {
    const pdfBytes = await makeBlankPdf()
    const png = await makeTestPng(20, 10)
    const fields: FieldEntry[] = [
      { type: 'image', page: 0, x: 100, y: 100, width: 200, height: 26, png },
    ]
    const result = await fillPdf(pdfBytes, fields)
    const doc = await PDFDocument.load(result)
    const page = doc.getPages()[0]
    const xobjects = page.node.Resources()?.lookup(PDFName.of('XObject'))
    expect(xobjects).toBeTruthy()
    expect(String(xobjects)).toContain('/Image')
  })

  it('fits a wide image inside the box, preserving aspect ratio', async () => {
    const pdfBytes = await makeBlankPdf()
    const png = await makeTestPng(400, 40) // 10:1
    const fields: FieldEntry[] = [
      { type: 'image', page: 0, x: 50, y: 50, width: 100, height: 100, png },
    ]
    const result = await fillPdf(pdfBytes, fields)
    // The drawn size is width-bound: 100 wide, 10 tall.
    const doc = await PDFDocument.load(result)
    const decoded = decodeContent(doc)
    // pdf-lib emits translate then scale: "1 0 0 1 x y cm" ... "w 0 0 h 0 0 cm".
    expect(decoded).toMatch(/1 0 0 1 50 50 cm[\s\S]*\n100 0 0 10 0 0 cm/)
  })

  it('fits a tall image inside the box, preserving aspect ratio', async () => {
    const pdfBytes = await makeBlankPdf()
    const png = await makeTestPng(40, 400) // 1:10
    const fields: FieldEntry[] = [
      { type: 'image', page: 0, x: 50, y: 50, width: 100, height: 100, png },
    ]
    const result = await fillPdf(pdfBytes, fields)
    const doc = await PDFDocument.load(result)
    const decoded = decodeContent(doc)
    expect(decoded).toMatch(/1 0 0 1 50 50 cm[\s\S]*\n10 0 0 100 0 0 cm/)
  })

  it('normalizeFields leaves image fields untouched', async () => {
    const png = await makeTestPng(2, 2)
    const field: FieldEntry = { type: 'image', page: 0, x: 1, y: 2, width: 3, height: 4, png }
    expect(normalizeFields([field])).toEqual([field])
  })
})
