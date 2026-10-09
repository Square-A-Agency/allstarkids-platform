import { prisma } from '@/lib/prisma'
import type { ApplicationDocument, EnrollmentApplication, Family } from '@/generated/prisma/client'

export type OwnedDocument =
  | { ok: true; doc: ApplicationDocument; application: EnrollmentApplication; family: Family }
  | { ok: false; status: 403 | 404; error: string }

/**
 * Parent-facing routes must only ever touch documents that belong to the
 * signed-in family. Missing -> 404. Someone else's -> 403.
 */
export async function getOwnedDocument(documentId: string, clerkUserId: string): Promise<OwnedDocument> {
  const row = await prisma.applicationDocument.findUnique({
    where: { id: documentId },
    include: { application: { include: { family: true } } },
  })
  if (!row) return { ok: false, status: 404, error: 'Document not found' }
  const { application, ...doc } = row
  const { family, ...app } = application
  if (family.clerkUserId !== clerkUserId) {
    return { ok: false, status: 403, error: 'This document belongs to another family' }
  }
  return { ok: true, doc: doc as ApplicationDocument, application: app as EnrollmentApplication, family }
}
