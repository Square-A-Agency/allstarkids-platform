import { describe, it, expect, vi, beforeEach } from 'vitest'

const findUnique = vi.hoisted(() => vi.fn())
vi.mock('@/lib/prisma', () => ({ prisma: { applicationDocument: { findUnique } } }))

import { getOwnedDocument } from '../family-auth'

const row = {
  id: 'doc_1', applicationId: 'app_1', documentType: 'no_liability',
  application: { id: 'app_1', familyId: 'fam_1', family: { id: 'fam_1', clerkUserId: 'user_a', firstName: 'A', lastName: 'B' } },
}

describe('getOwnedDocument', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 404 when the document does not exist', async () => {
    findUnique.mockResolvedValue(null)
    expect(await getOwnedDocument('nope', 'user_a')).toEqual({ ok: false, status: 404, error: 'Document not found' })
  })

  it('returns 403 when another family owns the document', async () => {
    findUnique.mockResolvedValue(row)
    const r = await getOwnedDocument('doc_1', 'user_b')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(403)
  })

  it('returns the doc, application and family for the owner', async () => {
    findUnique.mockResolvedValue(row)
    const r = await getOwnedDocument('doc_1', 'user_a')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.doc.id).toBe('doc_1')
      expect(r.application.id).toBe('app_1')
      expect(r.family.id).toBe('fam_1')
    }
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'doc_1' },
      include: { application: { include: { family: true } } },
    })
  })
})
