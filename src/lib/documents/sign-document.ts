import * as filler from './fill-pdf'
import { SIGNATURE_LINES, isSignableDocType } from './signature-lines'
import { formatSignDate } from './sign-date'
import type { FieldEntry } from './types'

export class SignatureError extends Error {}

const PNG_PREFIX = 'data:image/png;base64,'
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
export const MAX_SIGNATURE_BYTES = 200_000

export function decodeSignaturePng(dataUrl: unknown): Uint8Array {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith(PNG_PREFIX)) {
    throw new SignatureError('Please draw your signature before signing.')
  }
  const bytes = new Uint8Array(Buffer.from(dataUrl.slice(PNG_PREFIX.length), 'base64'))
  if (bytes.length > MAX_SIGNATURE_BYTES) {
    throw new SignatureError('That signature image is too large. Please clear and sign again.')
  }
  if (bytes.length < PNG_MAGIC.length || PNG_MAGIC.some((b, i) => bytes[i] !== b)) {
    throw new SignatureError('That signature could not be read. Please clear and sign again.')
  }
  return bytes
}

export function signedPathFor(fileUrl: string): string {
  return fileUrl.replace(/\.pdf$/i, '.signed.pdf')
}

export async function stampSignature(args: {
  documentType: string
  pdfBytes: Uint8Array
  signaturePng: Uint8Array
  signedAt: Date
  parentName: string
}): Promise<Uint8Array> {
  const { documentType, pdfBytes, signaturePng, signedAt, parentName } = args
  if (!isSignableDocType(documentType)) throw new Error(`Document type ${documentType} is not signable`)
  const layout = SIGNATURE_LINES[documentType]
  const date = formatSignDate(signedAt)

  const fields: FieldEntry[] = [
    ...layout.signatures.map((b) => ({ type: 'image' as const, ...b, png: signaturePng })),
    ...layout.dates.map((p) => ({ type: 'text' as const, ...p, value: date })),
  ]
  if (layout.printedName) fields.push({ type: 'text', ...layout.printedName, value: parentName })

  return filler.fillPdf(pdfBytes, fields)
}
