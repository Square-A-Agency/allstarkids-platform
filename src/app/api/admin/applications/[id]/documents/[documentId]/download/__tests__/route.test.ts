import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    applicationDocument: {
      findUnique: vi.fn(),
    },
  },
}))

const mockCreateSignedUrl = vi.fn()
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: mockCreateSignedUrl,
      })),
    },
  })),
}))

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { GET } from '../route'

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const mockFindUnique = prisma.applicationDocument.findUnique as ReturnType<typeof vi.fn>

const APP_ID = 'app_1'
const DOC_ID = 'doc_1'

function makeRequest() {
  return new Request(`https://example.com/api/admin/applications/${APP_ID}/documents/${DOC_ID}/download`)
}

function makeParams(overrides?: { id?: string; documentId?: string }) {
  return { params: Promise.resolve({ id: overrides?.id ?? APP_ID, documentId: overrides?.documentId ?? DOC_ID }) }
}

const successDoc = {
  id: DOC_ID,
  applicationId: APP_ID,
  documentType: 'enrollment_form',
  fileName: 'enrollment_form.pdf',
  fileUrl: 'documents/fam_1/child_1/enrollment_form.pdf',
  generationStatus: 'SUCCESS',
}

describe('GET /api/admin/applications/[id]/documents/[documentId]/download', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_USER_IDS = 'admin_user'
    mockAuth.mockResolvedValue({ userId: 'admin_user' })
  })

  it('returns 403 JSON for non-admin users', async () => {
    mockAuth.mockResolvedValue({ userId: 'random_user' })

    const res = await GET(makeRequest(), makeParams())

    expect(res.status).toBe(403)
    expect((await res.json()).error).toBeTruthy()
  })

  it('returns 404 JSON when the document does not exist', async () => {
    mockFindUnique.mockResolvedValue(null)

    const res = await GET(makeRequest(), makeParams())

    expect(res.status).toBe(404)
    expect((await res.json()).error).toBeTruthy()
  })

  it('returns 404 JSON when the document belongs to a different application', async () => {
    mockFindUnique.mockResolvedValue({ ...successDoc, applicationId: 'other_app' })

    const res = await GET(makeRequest(), makeParams())

    expect(res.status).toBe(404)
  })

  it('returns 404 JSON when the document has not generated successfully', async () => {
    mockFindUnique.mockResolvedValue({ ...successDoc, generationStatus: 'ERROR', fileUrl: '' })

    const res = await GET(makeRequest(), makeParams())

    expect(res.status).toBe(404)
  })

  it('redirects to a freshly minted signed URL on success', async () => {
    mockFindUnique.mockResolvedValue(successDoc)
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://supabase.example/storage/v1/object/sign/documents/x.pdf?token=fresh' },
      error: null,
    })

    const res = await GET(makeRequest(), makeParams())

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe(
      'https://supabase.example/storage/v1/object/sign/documents/x.pdf?token=fresh'
    )
    expect(mockCreateSignedUrl).toHaveBeenCalledWith(successDoc.fileUrl, 60)
  })

  it('returns 502 JSON when Supabase fails to sign the URL', async () => {
    mockFindUnique.mockResolvedValue(successDoc)
    mockCreateSignedUrl.mockResolvedValue({ data: null, error: { message: 'boom' } })

    const res = await GET(makeRequest(), makeParams())

    expect(res.status).toBe(502)
    expect((await res.json()).error).toBeTruthy()
  })
})
