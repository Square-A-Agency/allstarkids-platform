/**
 * Where the parent's signature, the date beside it, and (one form) the
 * printed name go on each generated DECAL document. PDF coordinates,
 * origin bottom-left, points. Director, Center Director, Witness By and
 * Signature of Provider lines are deliberately absent: those stay blank
 * for wet ink.
 *
 * Measured with `pdftotext -bbox-layout` on src/lib/documents/originals
 * and verified visually at 100 dpi (see the render check in the plan).
 */
export type Box = { page: number; x: number; y: number; width: number; height: number }
export type Point = { page: number; x: number; y: number }
export type SignatureLayout = { signatures: Box[]; dates: Point[]; printedName?: Point }

export const SIGNABLE_DOC_TYPES = [
  'enrollment_form',
  'authorization_topical',
  'no_liability',
  'infant_feeding',
  'transportation',
  'vehicle_emergency',
  'prek_child_reg',
  'ssn_information',
  'caps_referral',
] as const

export type SignableDocType = (typeof SIGNABLE_DOC_TYPES)[number]

export function isSignableDocType(t: string): t is SignableDocType {
  return (SIGNABLE_DOC_TYPES as readonly string[]).includes(t)
}

const H = 26 // signature box height in points

export const SIGNATURE_LINES: Record<SignableDocType, SignatureLayout> = {
  // Page 2 (index 2): "Signature____ Date:____" parent row (yMax 247.6).
  // Page 3 (index 3): first "Signed: ____ Date: ____" row is the parent (yMax 647.7);
  // the second row on that page is the center and stays blank.
  enrollment_form: {
    signatures: [
      { page: 2, x: 100, y: 546, width: 230, height: H },
      { page: 3, x: 95,  y: 146, width: 270, height: H },
    ],
    dates: [
      { page: 2, x: 425, y: 546 },
      { page: 3, x: 402, y: 146 },
    ],
  },
  // Labels sit under the line (label top yMin 464.7). Date label at x 385.
  authorization_topical: {
    signatures: [{ page: 0, x: 90, y: 331, width: 200, height: H }],
    dates: [{ page: 0, x: 385, y: 331 }],
  },
  // "Parents or Guardian's Signatures  Date" labels under the line (yMin 252.2);
  // "Parent or Guardian (Print Names)  Date" under the next (yMin 321.2).
  // "Center Director's Signature" (yMin 390.2) stays blank.
  no_liability: {
    signatures: [{ page: 0, x: 82, y: 543, width: 270, height: H }],
    dates: [
      { page: 0, x: 370, y: 543 },
      { page: 0, x: 367, y: 474 },
    ],
    printedName: { page: 0, x: 82, y: 474 },
  },
  // Page height is 790 on this form. "PARENT'S SIGNATURE: ____ Date: ____" (yMax 741.0).
  infant_feeding: {
    signatures: [{ page: 0, x: 155, y: 51, width: 225, height: H }],
    dates: [{ page: 0, x: 412, y: 51 }],
  },
  // "Signature (Parent/Guardian) ____ Date ____" (yMax 702.7).
  // The line starts at about x 218, past the end of the "Signature (Parent/Guardian)" label.
  transportation: {
    signatures: [{ page: 0, x: 218, y: 91, width: 195, height: H }],
    dates: [{ page: 0, x: 445, y: 91 }],
  },
  // "Signature (Parent/Guardian) ____" (yMax 669.8); the line starts at about x 218,
  // past the end of the label. The Date on the next row
  // belongs to "Witness By" and stays blank.
  vehicle_emergency: {
    signatures: [{ page: 0, x: 218, y: 124, width: 310, height: H }],
    dates: [],
  },
  // Page 0: "Signature Parent/Guardian: ____ DATE: ____" (yMax 723.3), DATE label at x 441-469.
  // Page 2: "SIGNATURE (Parent/Guardian): ____" twice (yMax 160.7 and 697.9),
  // each with "DATE: ____" on the following row (yMax 185.7 and 724.0).
  prek_child_reg: {
    signatures: [
      { page: 0, x: 150, y: 71,  width: 280, height: H },
      // height 18, not H: General Release text sits only ~16 pt above this line.
      { page: 2, x: 240, y: 633, width: 230, height: 18 },
      { page: 2, x: 235, y: 96,  width: 230, height: H },
    ],
    dates: [
      { page: 0, x: 472, y: 71 },
      { page: 2, x: 112, y: 608 },
      { page: 2, x: 110, y: 73 },
    ],
  },
  // "Today's Date:" at the top (yMax 174.2, label ends x 111).
  // "Parent/Guardian Signature" label under the line (yMin 573.8).
  ssn_information: {
    signatures: [{ page: 0, x: 50, y: 222, width: 220, height: H }],
    dates: [{ page: 0, x: 115, y: 620 }],
  },
  // "Signature of Parent   Date" labels under the line (yMin 481.6), Date at x 389.
  // "Signature of Provider" (yMin 734.4) stays blank.
  caps_referral: {
    signatures: [{ page: 0, x: 51, y: 314, width: 230, height: H }],
    dates: [{ page: 0, x: 389, y: 318 }],
  },
}
