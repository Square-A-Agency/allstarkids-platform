
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
const getOwnedDocument = vi.hoisted(() => vi.fn())
vi.mock('@/lib/family-auth', () => ({ getOwnedDocument }))
const downloadDocument = vi.hoisted(() => vi.fn()); const uploadDocument = vi.hoisted(() => vi.fn())
vi.mock('@/lib/documents/storage', () => ({
  downloadDocument, uploadDocument, // 64-char hex so it passes the route's reviewedSha256 format check
  sha256Hex: (b: Uint8Array) => b.length.toString(16).padStart(64, '0'),
}))
const stampSignature = vi.hoisted(() => vi.fn())
vi.mock('@/lib/documents/sign-document', async (orig) => ({
  ...(await orig<typeof import('@/lib/documents/sign-document')>()),
  stampSignature,
}))
const updateMany = vi.hoisted(() => vi.fn()); const updateDoc = vi.hoisted(() => vi.fn()); const findManyDocs = vi.hoisted(() => vi.fn()); const updateApp = vi.hoisted(() => vi.fn()); const countApps = vi.hoisted(() => vi.fn())
vi.mock('@/lib/prisma', () => ({
  prisma: {
    applicationDocument: { update: updateDoc, updateMany, findMany: findManyDocs },
    enrollmentApplication: { update: updateApp, count: countApps },
  },
}))
const sendDocumentsSignedEmail = vi.hoisted(() => vi.fn())
vi.mock('@/lib/enrollment-emails', () => ({ sendDocumentsSignedEmail }))

import { auth } from '@clerk/nextjs/server'
import { POST } from '../route'

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const TINY_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
const hashOf = (n: number) => n.toString(16).padStart(64, '0')
const REVIEWED = hashOf(10)
const params = () => ({ params: Promise.resolve({ documentId: 'doc_1' }) })
const req = (body: Record<string, unknown>, headers: Record<string, string> = {}) =>
  new Request('https://example.com/api/enrollment/documents/doc_1/sign', {
    method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'TestUA', 'x-forwarded-for': '203.0.113.9, 10.0.0.1', ...headers },
    body: JSON.stringify({ reviewedSha256: REVIEWED, ...body }),
  })

const UNSIGNED = new Uint8Array(10) // sha256Hex -> hashOf(10)
const owned = (doc = {}, app = {}) => ({
  ok: true,
  doc: { id: 'doc_1', applicationId: 'app_1', documentType: 'no_liability', generationStatus: 'SUCCESS',
         fileUrl: 'documents/f/c/no_liability.pdf', signedAt: null, signedFileUrl: null, unsignedSha256: hashOf(10), ...doc },
  application: { id: 'app_1', familyId: 'fam_1', eSignConsentAt: new Date('2026-10-01'), signatureParent: null, ...app },
  family: { id: 'fam_1', firstName: 'Amara', lastName: 'Johnson', email: 'amara@example.com' },
})

describe('POST /api/enrollment/documents/[documentId]/sign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_a' })
    downloadDocument.mockResolvedValue(UNSIGNED)
    stampSignature.mockResolvedValue(new Uint8Array(20)) // sha256Hex -> hashOf(20)
    findManyDocs.mockResolvedValue([
      { documentType: 'no_liability', generationStatus: 'SUCCESS', fileUrl: 'x', signedAt: new Date() },
      { documentType: 'vehicle_emergency', generationStatus: 'SUCCESS', fileUrl: 'x', signedAt: null },
    ])
    countApps.mockResolvedValue(1)
    updateMany.mockResolvedValue({ count: 1 })
  })

  it('401 when signed out', async () => {
    mockAuth.mockResolvedValue({ userId: null })
    expect((await POST(req({ signature: TINY_PNG }), params())).status).toBe(401)
  })

  it('403 for another family', async () => {
    getOwnedDocument.mockResolvedValue({ ok: false, status: 403, error: 'nope' })
    expect((await POST(req({ signature: TINY_PNG }), params())).status).toBe(403)
  })

  it('400 for a non-signable document type (parent upload)', async () => {
    getOwnedDocument.mockResolvedValue(owned({ documentType: 'BIRTH_CERTIFICATE' }))
    expect((await POST(req({ signature: TINY_PNG }), params())).status).toBe(400)
  })

  it('409 when the document is not generated', async () => {
    getOwnedDocument.mockResolvedValue(owned({ generationStatus: 'ERROR', fileUrl: '' }))
    expect((await POST(req({ signature: TINY_PNG }), params())).status).toBe(409)
  })

  it('409 when already signed', async () => {
    getOwnedDocument.mockResolvedValue(owned({ signedAt: new Date() }))
    expect((await POST(req({ signature: TINY_PNG }), params())).status).toBe(409)
    expect(stampSignature).not.toHaveBeenCalled()
  })

  it('400 without consent on a pre-existing application, success with consent: true', async () => {
    getOwnedDocument.mockResolvedValue(owned({}, { eSignConsentAt: null }))
    expect((await POST(req({ signature: TINY_PNG }), params())).status).toBe(400)
    const res = await POST(req({ signature: TINY_PNG, consent: true }), params())
    expect(res.status).toBe(200)
    expect(updateApp.mock.calls[0][0].data.eSignConsentAt).toBeInstanceOf(Date)
  })

  it('400 for a bad signature payload', async () => {
    getOwnedDocument.mockResolvedValue(owned())
    expect((await POST(req({ signature: 'data:image/jpeg;base64,AAAA' }), params())).status).toBe(400)
  })

  it('409 when the stored bytes no longer match the recorded hash', async () => {
    getOwnedDocument.mockResolvedValue(owned({ unsignedSha256: 'stale' }))
    const res = await POST(req({ signature: TINY_PNG }), params())
    expect(res.status).toBe(409)
    expect((await res.json()).error).toMatch(/reload/i)
    expect(uploadDocument).not.toHaveBeenCalled()
  })

  it('400 when reviewedSha256 is missing', async () => {
    getOwnedDocument.mockResolvedValue(owned())
    const res = await POST(req({ signature: TINY_PNG, reviewedSha256: undefined }), params())
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Please review the document before signing.')
    expect(downloadDocument).not.toHaveBeenCalled()
    expect(updateMany).not.toHaveBeenCalled()
  })

  it('409 when reviewedSha256 differs from the stored bytes', async () => {
    getOwnedDocument.mockResolvedValue(owned())
    const res = await POST(req({ signature: TINY_PNG, reviewedSha256: hashOf(99) }), params())
    expect(res.status).toBe(409)
    expect((await res.json()).error).toMatch(/reload/i)
    expect(updateMany).not.toHaveBeenCalled()
    expect(uploadDocument).not.toHaveBeenCalled()
  })

  it('stamps, uploads the signed copy, and records the audit fields', async () => {
    getOwnedDocument.mockResolvedValue(owned())
    const res = await POST(req({ signature: TINY_PNG }), params())
    expect(res.status).toBe(200)
    expect(stampSignature).toHaveBeenCalledWith(expect.objectContaining({
      documentType: 'no_liability', pdfBytes: UNSIGNED, parentName: 'Amara Johnson',
    }))
    expect(uploadDocument).toHaveBeenCalledWith('documents/f/c/no_liability.signed.pdf', expect.any(Uint8Array))
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'doc_1', signedAt: null },
      data: expect.objectContaining({ signedAt: expect.any(Date), signedIp: '203.0.113.9', signedUserAgent: 'TestUA' }),
    })
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'doc_1', signedAt: expect.any(Date), unsignedSha256: hashOf(10) },
      data: expect.objectContaining({
        signedFileUrl: 'documents/f/c/no_liability.signed.pdf', signedSha256: hashOf(20),
      }),
    })
    // first signature of the session is kept on the application
    expect(updateApp.mock.calls[0][0].data).toMatchObject({ signatureParent: TINY_PNG, signatureDate: expect.any(Date) })
    const body = await res.json()
    expect(body.applicationSigned).toBe(false)
    expect(sendDocumentsSignedEmail).not.toHaveBeenCalled()
  })

  it('marks the application signed when every signable document is signed, and emails when the family is done', async () => {
    getOwnedDocument.mockResolvedValue(owned())
    findManyDocs.mockResolvedValue([
      { documentType: 'no_liability', generationStatus: 'SUCCESS', fileUrl: 'x', signedAt: new Date() },
      { documentType: 'BIRTH_CERTIFICATE', generationStatus: 'SUCCESS', fileUrl: 'x', signedAt: null }, // ignored
    ])
    countApps.mockResolvedValue(0)
    const res = await POST(req({ signature: TINY_PNG }), params())
    const body = await res.json()
    expect(body.applicationSigned).toBe(true)
    expect(body.familySigned).toBe(true)
    expect(updateApp.mock.calls[0][0].data.documentsSignedAt).toBeInstanceOf(Date)
    expect(countApps).toHaveBeenCalledWith({
      where: { familyId: 'fam_1', documentsSignedAt: null, status: { not: 'REJECTED' }, documents: { some: { generationStatus: 'SUCCESS' } } },
    })
    expect(sendDocumentsSignedEmail).toHaveBeenCalledWith(expect.objectContaining({ email: 'amara@example.com' }))
  })

  it('never marks an application signed when it has no signable generated documents', async () => {
    getOwnedDocument.mockResolvedValue(owned())
    findManyDocs.mockResolvedValue([
      { documentType: 'no_liability', generationStatus: 'ERROR', fileUrl: '', signedAt: null },
    ])
    const res = await POST(req({ signature: TINY_PNG }), params())
    expect((await res.json()).applicationSigned).toBe(false)
    expect(updateApp.mock.calls[0][0].data.documentsSignedAt).toBeUndefined()
    expect(sendDocumentsSignedEmail).not.toHaveBeenCalled()
  })

  it('still returns 200 when the email fails', async () => {
    getOwnedDocument.mockResolvedValue(owned())
    findManyDocs.mockResolvedValue([{ documentType: 'no_liability', generationStatus: 'SUCCESS', fileUrl: 'x', signedAt: new Date() }])
    countApps.mockResolvedValue(0)
    sendDocumentsSignedEmail.mockRejectedValue(new Error('resend down'))
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await POST(req({ signature: TINY_PNG }), params())).status).toBe(200)
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })

  const rollback = { where: { id: 'doc_1' }, data: { signedAt: null, signedIp: null, signedUserAgent: null } }

  it('400, rollback and no upload when the signature PNG cannot be embedded', async () => {
    getOwnedDocument.mockResolvedValue(owned())
    stampSignature.mockRejectedValueOnce(new Error('corrupt png'))
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await POST(req({ signature: TINY_PNG }), params())
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('That signature could not be read. Please clear and sign again.')
    expect(uploadDocument).not.toHaveBeenCalled()
    expect(updateDoc).toHaveBeenCalledTimes(1)
    expect(updateDoc).toHaveBeenCalledWith(rollback)
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })

  it('502 and rollback when the upload fails', async () => {
    getOwnedDocument.mockResolvedValue(owned())
    uploadDocument.mockRejectedValueOnce(new Error('storage down'))
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await POST(req({ signature: TINY_PNG }), params())
    expect(res.status).toBe(502)
    expect((await res.json()).error).toBe('Could not save the signed document. Please try again.')
    expect(updateDoc).toHaveBeenCalledTimes(1)
    expect(updateDoc).toHaveBeenCalledWith(rollback)
    expect(updateApp).not.toHaveBeenCalled()
    errSpy.mockRestore()
  })

  it('finalize count 0 -> 409 and the claim is rolled back', async () => {
    getOwnedDocument.mockResolvedValue(owned())
    updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 })
    const res = await POST(req({ signature: TINY_PNG }), params())
    expect(res.status).toBe(409)
    expect((await res.json()).error).toMatch(/reload/i)
    expect(updateDoc).toHaveBeenCalledTimes(1)
    expect(updateDoc).toHaveBeenCalledWith(rollback)
    expect(updateApp).not.toHaveBeenCalled()
  })

  it('finalize throws -> 502, rollback update called, no application update', async () => {
    getOwnedDocument.mockResolvedValue(owned())
    updateMany.mockResolvedValueOnce({ count: 1 }).mockRejectedValueOnce(new Error('db down'))
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await POST(req({ signature: TINY_PNG }), params())
    expect(res.status).toBe(502)
    expect((await res.json()).error).toBe('Could not save the signed document. Please try again.')
    expect(updateDoc).toHaveBeenCalledWith(rollback)
    expect(updateApp).not.toHaveBeenCalled()
    errSpy.mockRestore()
  })

  it('409 and nothing else when a concurrent request already claimed the document', async () => {
    getOwnedDocument.mockResolvedValue(owned())
    updateMany.mockResolvedValue({ count: 0 })
    const res = await POST(req({ signature: TINY_PNG }), params())
    expect(res.status).toBe(409)
    expect(stampSignature).not.toHaveBeenCalled()
    expect(uploadDocument).not.toHaveBeenCalled()
    expect(updateDoc).not.toHaveBeenCalled()
    expect(updateApp).not.toHaveBeenCalled()
  })

  it('records a null IP when x-forwarded-for is empty', async () => {
    getOwnedDocument.mockResolvedValue(owned())
    const res = await POST(req({ signature: TINY_PNG }, { 'x-forwarded-for': '' }), params())
    expect(res.status).toBe(200)
    expect(updateMany.mock.calls[0][0].data.signedIp).toBeNull()
  })
})
