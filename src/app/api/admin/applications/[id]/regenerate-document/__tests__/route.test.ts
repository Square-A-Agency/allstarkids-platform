import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
const findUnique = vi.hoisted(() => vi.fn())
vi.mock('@/lib/prisma', () => ({ prisma: { applicationDocument: { findUnique } } }))
const generateSingleDocument = vi.hoisted(() => vi.fn())
vi.mock('@/lib/documents/generate-documents', () => ({ generateSingleDocument }))

import { auth } from '@clerk/nextjs/server'
import { POST } from '../route'

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const params = () => ({ params: Promise.resolve({ id: 'app_1' }) })
const req = (body: unknown) =>
  new Request('https://example.com/api/admin/applications/app_1/regenerate-document', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })

describe('POST regenerate-document signature guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_USER_IDS = 'admin_user'
    mockAuth.mockResolvedValue({ userId: 'admin_user' })
  })

  it('regenerates an unsigned document without confirmation', async () => {
    findUnique.mockResolvedValue({ id: 'doc_1', signedAt: null })
    const res = await POST(req({ documentType: 'no_liability' }), params())
    expect(res.status).toBe(200)
    expect(generateSingleDocument).toHaveBeenCalledWith('app_1', 'no_liability')
  })

  it('409 with requiresConfirm when the document is signed and confirm is missing', async () => {
    findUnique.mockResolvedValue({ id: 'doc_1', signedAt: new Date() })
    const res = await POST(req({ documentType: 'no_liability' }), params())
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ requiresConfirm: true })
    expect(generateSingleDocument).not.toHaveBeenCalled()
  })

  it('regenerates a signed document when confirm is true', async () => {
    findUnique.mockResolvedValue({ id: 'doc_1', signedAt: new Date() })
    const res = await POST(req({ documentType: 'no_liability', confirm: true }), params())
    expect(res.status).toBe(200)
    expect(generateSingleDocument).toHaveBeenCalled()
  })
})
