import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

const mockCreateSignedUploadUrl = vi.fn()
vi.mock('@/lib/supabase-admin', () => ({
  getSupabaseAdmin: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        createSignedUploadUrl: mockCreateSignedUploadUrl,
      })),
    },
  })),
}))

import { auth } from '@clerk/nextjs/server'
import { POST } from '../route'

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>

function makeRequest(body: unknown) {
  return new Request('https://example.com/api/enrollment/upload-url', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBody = { fileName: 'birth cert.pdf', documentType: 'BIRTH_CERTIFICATE', tempId: 'child-1' }

describe('POST /api/enrollment/upload-url', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_parent' })
    mockCreateSignedUploadUrl.mockResolvedValue({
      data: { path: 'x', token: 'tok_123', signedUrl: 'https://supabase/x' },
      error: null,
    })
  })

  it('returns 401 JSON when not signed in', async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(401)
    expect((await res.json()).error).toBeTruthy()
  })

  it('returns 400 for an unknown document type', async () => {
    const res = await POST(makeRequest({ ...validBody, documentType: 'EVIL_TYPE' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when fileName or tempId is missing', async () => {
    expect((await POST(makeRequest({ ...validBody, fileName: '' }))).status).toBe(400)
    expect((await POST(makeRequest({ ...validBody, tempId: '' }))).status).toBe(400)
  })

  it('mints a signed upload URL under the signed-in user and returns path + token', async () => {
    const res = await POST(makeRequest(validBody))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.token).toBe('tok_123')
    expect(body.path).toMatch(/^uploads\/user_parent\/child-1\/BIRTH_CERTIFICATE\//)
    expect(body.path).toMatch(/birth_cert\.pdf$/)
    expect(mockCreateSignedUploadUrl).toHaveBeenCalledWith(body.path)
  })

  it('strips path traversal from the file name', async () => {
    const res = await POST(makeRequest({ ...validBody, fileName: '../../etc/passwd' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.path).not.toContain('..')
    expect(body.path).toMatch(/^uploads\/user_parent\/child-1\/BIRTH_CERTIFICATE\//)
  })

  it('sanitizes tempId to safe characters', async () => {
    const res = await POST(makeRequest({ ...validBody, tempId: 'a/../b' }))
    expect((await res.json()).path).not.toContain('..')
  })

  it('returns 502 when Supabase fails to mint the URL', async () => {
    mockCreateSignedUploadUrl.mockResolvedValue({ data: null, error: { message: 'boom' } })
    expect((await POST(makeRequest(validBody))).status).toBe(502)
  })
})
