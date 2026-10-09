import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { PDFDocument } from 'pdf-lib'
import { SIGNATURE_LINES, SIGNABLE_DOC_TYPES, isSignableDocType } from '../signature-lines'

const EXPECTED_COUNTS: Record<string, { signatures: number; dates: number; printedName: boolean }> = {
  enrollment_form:       { signatures: 2, dates: 2, printedName: false },
  authorization_topical: { signatures: 1, dates: 1, printedName: false },
  no_liability:          { signatures: 1, dates: 2, printedName: true },
  infant_feeding:        { signatures: 1, dates: 1, printedName: false },
  transportation:        { signatures: 1, dates: 1, printedName: false },
  vehicle_emergency:     { signatures: 1, dates: 0, printedName: false },
  prek_child_reg:        { signatures: 3, dates: 3, printedName: false },
  ssn_information:       { signatures: 1, dates: 1, printedName: false },
  caps_referral:         { signatures: 1, dates: 1, printedName: false },
}

describe('SIGNATURE_LINES', () => {
  it('covers exactly the nine generated document types', () => {
    expect(Object.keys(SIGNATURE_LINES).sort()).toEqual([...SIGNABLE_DOC_TYPES].sort())
    expect(SIGNABLE_DOC_TYPES).toHaveLength(9)
  })

  for (const [docType, expected] of Object.entries(EXPECTED_COUNTS)) {
    it(`${docType} has ${expected.signatures} signature box(es) and ${expected.dates} date blank(s)`, () => {
      const layout = SIGNATURE_LINES[docType as keyof typeof SIGNATURE_LINES]
      expect(layout.signatures).toHaveLength(expected.signatures)
      expect(layout.dates).toHaveLength(expected.dates)
      expect(!!layout.printedName).toBe(expected.printedName)
    })

    it(`${docType} only targets pages that exist in the original`, async () => {
      const bytes = fs.readFileSync(path.join(process.cwd(), 'src/lib/documents/originals', `${docType}.pdf`))
      const doc = await PDFDocument.load(bytes)
      const pageCount = doc.getPageCount()
      const layout = SIGNATURE_LINES[docType as keyof typeof SIGNATURE_LINES]
      for (const box of layout.signatures) expect(box.page).toBeLessThan(pageCount)
      for (const pt of layout.dates) expect(pt.page).toBeLessThan(pageCount)
      if (layout.printedName) expect(layout.printedName.page).toBeLessThan(pageCount)
    })
  }

  it('every signature box has a positive size inside a letter page', () => {
    for (const layout of Object.values(SIGNATURE_LINES)) {
      for (const box of layout.signatures) {
        expect(box.width).toBeGreaterThan(0)
        expect(box.height).toBeGreaterThan(0)
        expect(box.x + box.width).toBeLessThanOrEqual(612)
        expect(box.y + box.height).toBeLessThanOrEqual(792)
      }
    }
  })
})

describe('isSignableDocType', () => {
  it('accepts generated types and rejects parent uploads', () => {
    expect(isSignableDocType('enrollment_form')).toBe(true)
    expect(isSignableDocType('BIRTH_CERTIFICATE')).toBe(false)
    expect(isSignableDocType('')).toBe(false)
  })
})
