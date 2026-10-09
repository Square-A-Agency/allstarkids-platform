import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOwnedDocument } from '@/lib/family-auth'
import { downloadDocument, uploadDocument, sha256Hex } from '@/lib/documents/storage'
import { decodeSignaturePng, stampSignature, signedPathFor, SignatureError } from '@/lib/documents/sign-document'
import { isSignableDocType } from '@/lib/documents/signature-lines'
import { signingSummary } from '@/lib/documents/signing-summary'
import { sendDocumentsSignedEmail } from '@/lib/enrollment-emails'

// Stamping one PDF is fast, but keep the same headroom the generators use.
export const maxDuration = 60

const UPDATED_MESSAGE = 'This document was updated by the school. Please reload the page and review it again.'

const ROLLBACK_DATA = { signedAt: null, signedIp: null, signedUserAgent: null } as const

export async function POST(req: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { documentId } = await params
  const body = await req.json().catch(() => null)
  const consent = body?.consent === true

  const owned = await getOwnedDocument(documentId, userId)
  if (!owned.ok) return NextResponse.json({ error: owned.error }, { status: owned.status })
  const { doc, application, family } = owned

  if (!isSignableDocType(doc.documentType)) {
    return NextResponse.json({ error: 'This document does not take a signature.' }, { status: 400 })
  }
  if (doc.generationStatus !== 'SUCCESS' || !doc.fileUrl) {
    return NextResponse.json({ error: 'This document is still being prepared.' }, { status: 409 })
  }
  if (doc.signedAt) {
    return NextResponse.json({ error: 'This document is already signed.' }, { status: 409 })
  }
  if (!application.eSignConsentAt && !consent) {
    return NextResponse.json({ error: 'Please agree to sign electronically first.' }, { status: 400 })
  }

  let signaturePng: Uint8Array
  try {
    signaturePng = decodeSignaturePng(body?.signature)
  } catch (err) {
    const message = err instanceof SignatureError ? err.message : 'Invalid signature'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const reviewedSha256 = body?.reviewedSha256
  if (typeof reviewedSha256 !== 'string' || !/^[0-9a-f]{64}$/i.test(reviewedSha256)) {
    return NextResponse.json({ error: 'Please review the document before signing.' }, { status: 400 })
  }

  const unsigned = await downloadDocument(doc.fileUrl)
  const unsignedHash = sha256Hex(unsigned)
  if ((doc.unsignedSha256 && doc.unsignedSha256 !== unsignedHash) || reviewedSha256.toLowerCase() !== unsignedHash) {
    return NextResponse.json({ error: UPDATED_MESSAGE }, { status: 409 })
  }

  const signedAt = new Date()
  const signedIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const signedUserAgent = req.headers.get('user-agent') ?? null

  // Claim the row atomically so concurrent requests cannot both sign it.
  const claimed = await prisma.applicationDocument.updateMany({
    where: { id: doc.id, signedAt: null },
    data: { signedAt, signedIp, signedUserAgent },
  })
  if (claimed.count === 0) {
    return NextResponse.json({ error: 'This document is already signed.' }, { status: 409 })
  }

  const signedFileUrl = signedPathFor(doc.fileUrl)
  let stamped: Uint8Array
  let stage: 'stamp' | 'upload' | 'finalize' = 'stamp'
  let finalizedCount = 0
  try {
    stamped = await stampSignature({
      documentType: doc.documentType,
      pdfBytes: unsigned,
      signaturePng,
      signedAt,
      parentName: `${family.firstName} ${family.lastName}`.trim(),
    })
    stage = 'upload'
    await uploadDocument(signedFileUrl, stamped)
    stage = 'finalize'
    // Conditional on the row still being the one we claimed over the same
    // original bytes; a regeneration in between clears signedAt/changes the hash.
    const finalized = await prisma.applicationDocument.updateMany({
      where: { id: doc.id, signedAt, unsignedSha256: doc.unsignedSha256 ?? null },
      data: {
        signedFileUrl,
        signedSha256: sha256Hex(stamped),
        ...(doc.unsignedSha256 ? {} : { unsignedSha256: unsignedHash }),
      },
    })
    finalizedCount = finalized.count
  } catch (err) {
    console.error(`Failed to ${stage} signed document:`, err)
    await prisma.applicationDocument.update({ where: { id: doc.id }, data: ROLLBACK_DATA })
    if (stage === 'stamp') {
      return NextResponse.json(
        { error: 'That signature could not be read. Please clear and sign again.' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Could not save the signed document. Please try again.' },
      { status: 502 }
    )
  }

  if (finalizedCount === 0) {
    await prisma.applicationDocument.update({ where: { id: doc.id }, data: ROLLBACK_DATA })
    return NextResponse.json({ error: UPDATED_MESSAGE }, { status: 409 })
  }

  const docs = await prisma.applicationDocument.findMany({ where: { applicationId: application.id } })
  const summary = signingSummary(docs)

  await prisma.enrollmentApplication.update({
    where: { id: application.id },
    data: {
      ...(application.eSignConsentAt ? {} : { eSignConsentAt: signedAt }),
      ...(application.signatureParent ? {} : { signatureParent: body.signature, signatureDate: signedAt }),
      ...(summary.complete ? { documentsSignedAt: signedAt } : {}),
    },
  })

  let familySigned = false
  if (summary.complete) {
    const remaining = await prisma.enrollmentApplication.count({
      where: {
        familyId: family.id,
        status: { not: 'REJECTED' },
        documentsSignedAt: null,
        documents: { some: { generationStatus: 'SUCCESS' } },
      },
    })
    familySigned = remaining === 0
    if (familySigned) {
      try {
        await sendDocumentsSignedEmail({ email: family.email, firstName: family.firstName })
      } catch (err) {
        console.error('Failed to send documents-signed email:', err)
      }
    }
  }

  return NextResponse.json({
    success: true,
    signedAt: signedAt.toISOString(),
    applicationSigned: summary.complete,
    familySigned,
  })
}
