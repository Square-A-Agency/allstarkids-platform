import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
const getOwnedDocument = vi.hoisted(() => vi.fn())
vi.mock('@/lib/family-auth', () => ({ getOwnedDocument }))
const downloadDocument = vi.hoisted(() => vi.fn())
vi.mock('@/lib/documents/storage', () => ({ downloadDocument }))

import { auth } from '@clerk/nextjs/server'
import { GET } from '../route'

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const params = (documentId = 'doc_1') => ({ params: Promise.resolve({ documentId }) })
const req = (qs = '') => new Request(`https://example.com/api/enrollment/documents/doc_1${qs}`)

const owned = (docOverrides = {}) => ({
  ok: true,
  doc: { id: 'doc_1', documentType: 'no_liability', fileName: 'no_liability.pdf', generationStatus: 'SUCCESS',
         fileUrl: 'documents/f/c/no_liability.pdf', signedFileUrl: null, ...docOverrides },
  application: { id: 'app_1' },
  family: { id: 'fam_1' },
})

describe('GET /api/enrollment/documents/[documentId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_a' })
    downloadDocument.mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46]))
  })

  it('401 when signed out', async () => {
    mockAuth.mockResolvedValue({ userId: null })
    expect((await GET(req(), params())).status).toBe(401)
  })

  it('passes ownership failures through', async () => {
    getOwnedDocument.mockResolvedValue({ ok: false, status: 403, error: 'nope' })
    const res = await GET(req(), params())
    expect(res.status).toBe(403)
    expect((await res.json()).error).toBe('nope')
  })

  it('409 when the document has not generated', async () => {
    getOwnedDocument.mockResolvedValue(owned({ generationStatus: 'ERROR', fileUrl: '' }))
    expect((await GET(req(), params())).status).toBe(409)
  })

  it('streams the original when no signed copy exists', async () => {
    getOwnedDocument.mockResolvedValue(owned())
    const res = await GET(req(), params())
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/pdf')
    expect(downloadDocument).toHaveBeenCalledWith('documents/f/c/no_liability.pdf')
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(new Uint8Array([0x25, 0x50, 0x44, 0x46]))
  })

  it('streams the signed copy by default when one exists, and the original on request', async () => {
    getOwnedDocument.mockResolvedValue(owned({ signedFileUrl: 'documents/f/c/no_liability.signed.pdf' }))
    await GET(req(), params())
    expect(downloadDocument).toHaveBeenLastCalledWith('documents/f/c/no_liability.signed.pdf')
    await GET(req('?version=original'), params())
    expect(downloadDocument).toHaveBeenLastCalledWith('documents/f/c/no_liability.pdf')
  })

  it('502 when storage fails', async () => {
    getOwnedDocument.mockResolvedValue(owned())
    downloadDocument.mockRejectedValue(new Error('boom'))
    expect((await GET(req(), params())).status).toBe(502)
  })
})
