import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { FieldEntry } from './types'

const DEFAULT_FONT_SIZE = 10
const TEXT_COLOR = rgb(0, 0, 0)

export async function fillPdf(pdfBytes: Uint8Array, fields: FieldEntry[]): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes)
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const pages = doc.getPages()

  for (const field of fields) {
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
        size: 10,
        font,
        color: TEXT_COLOR,
      })
    }
  }

  return doc.save()
}
