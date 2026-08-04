import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { FieldEntry } from './types'

const DEFAULT_FONT_SIZE = 10
const TEXT_COLOR = rgb(0, 0, 0)

/**
 * DECAL reviewers read a blank line as an incomplete form, so every mapped
 * text blank that has no answer prints "N/A". Lines that must stay empty for
 * hand completion (signatures, dates-at-signing) are simply never emitted by
 * the maps. Checkboxes pass through untouched.
 */
export function normalizeFields(fields: FieldEntry[]): FieldEntry[] {
  return fields.map((field) =>
    field.type === 'text' && field.value.trim() === '' ? { ...field, value: 'N/A' } : field
  )
}

export async function fillPdf(pdfBytes: Uint8Array, fields: FieldEntry[]): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes)
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const pages = doc.getPages()

  for (const field of normalizeFields(fields)) {
    const page = pages[field.page]
    if (!page) continue  // skip fields targeting non-existent pages

    if (field.type === 'text') {
      if (!field.value) continue
      page.drawText(field.value, {
        x: field.x,
        y: field.y,
        size: field.fontSize ?? DEFAULT_FONT_SIZE,
        font,
        color: TEXT_COLOR,
      })
    } else if (field.type === 'checkbox' && field.checked) {
      page.drawText('X', {
        x: field.x,
        y: field.y,
        size: DEFAULT_FONT_SIZE,
        font,
        color: TEXT_COLOR,
      })
    }
  }

  return doc.save()
}
