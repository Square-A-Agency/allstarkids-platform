import { describe, it, expect, vi, beforeEach } from 'vitest'

const { upsert, findUniqueDoc, updateApp, uploadDocument, moveDocument, transaction, fillPdfMock } = vi.hoisted(() => ({
  transaction: vi.fn(async (ops: unknown[]) => Promise.all(ops)),
  fillPdfMock: vi.fn(),
  upsert: vi.fn(),
  findUniqueDoc: vi.fn(),
  updateApp: vi.fn(),
  uploadDocument: vi.fn(),
  moveDocument: vi.fn(),
}))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    applicationDocument: { upsert, findUnique: findUniqueDoc },
    enrollmentApplication: { update: updateApp },
    $transaction: transaction,
  },
}))

vi.mock('../storage', () => ({
  uploadDocument,
  moveDocument,
  sha256Hex: () => 'deadbeef',
  historyPathFor: (p: string) => p.replace('.signed.pdf', '.signed.HIST.pdf').replace(/([^/]+)$/, 'history/$1'),
}))

vi.mock('../fill-pdf', () => ({ fillPdf: fillPdfMock }))
vi.mock('fs', () => ({ readFileSync: () => Buffer.from('pdf') }))

import { generateAndStore } from '../generate-documents'
import type { ApplicationData } from '../types'

const data = {
  applicationId: 'app_1', familyId: 'fam_1', childId: 'child_1',
  topical: {}, pickups: [], emergencyContacts: [], schedule: { daysOfWeek: [], mealPlan: [] },
  transport: { days: [] }, infant: { feedingPlan: null }, preK: {}, parent1: {}, parent2: {}, child: {},
  doctor: {},
} as unknown as ApplicationData

describe('generateAndStore with signatures', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fillPdfMock.mockResolvedValue(new Uint8Array([1, 2, 3]))
    transaction.mockImplementation(async (ops: unknown[]) => Promise.all(ops))
  })

  const signedRow = {
    id: 'doc_1', applicationId: 'app_1', documentType: 'vehicle_emergency',
    signedFileUrl: 'documents/fam_1/child_1/vehicle_emergency.signed.pdf', signedAt: new Date(),
  }
  const cleared = { signedFileUrl: null, signedAt: null, signedIp: null, signedUserAgent: null, signedSha256: null }

  it('records unsignedSha256 on a fresh generation', async () => {
    findUniqueDoc.mockResolvedValue(null)
    await generateAndStore('app_1', 'vehicle_emergency', data)
    expect(uploadDocument).toHaveBeenCalledWith('documents/fam_1/child_1/vehicle_emergency.pdf', expect.any(Uint8Array))
    const call = upsert.mock.calls[0][0]
    expect(call.update.unsignedSha256).toBe('deadbeef')
    expect(call.create.unsignedSha256).toBe('deadbeef')
    expect(call.update).toMatchObject(cleared)
    expect(updateApp).toHaveBeenCalledWith({ where: { id: 'app_1' }, data: { documentsSignedAt: null } })
    expect(moveDocument).not.toHaveBeenCalled()
  })

  it('a row with signedAt but no signedFileUrl (claimed, never finalized) gets its signed fields cleared and the archive attempted at the derived .signed.pdf path', async () => {
    findUniqueDoc.mockResolvedValue({
      id: 'doc_1', applicationId: 'app_1', documentType: 'vehicle_emergency',
      fileUrl: 'documents/fam_1/child_1/vehicle_emergency.pdf', signedFileUrl: null, signedAt: new Date(),
    })
    moveDocument.mockRejectedValueOnce(new Error('Object not found'))
    await generateAndStore('app_1', 'vehicle_emergency', data)
    expect(moveDocument).toHaveBeenCalledWith(
      'documents/fam_1/child_1/vehicle_emergency.signed.pdf',
      'documents/fam_1/child_1/history/vehicle_emergency.signed.HIST.pdf'
    )
    expect(upsert.mock.calls[0][0].update).toMatchObject(cleared)
    expect(updateApp).toHaveBeenCalledWith({ where: { id: 'app_1' }, data: { documentsSignedAt: null } })
  })

  it('moves a previously signed copy to history and clears the signed fields', async () => {
    findUniqueDoc.mockResolvedValue({
      id: 'doc_1', applicationId: 'app_1', documentType: 'vehicle_emergency',
      signedFileUrl: 'documents/fam_1/child_1/vehicle_emergency.signed.pdf', signedAt: new Date(),
    })
    await generateAndStore('app_1', 'vehicle_emergency', data)
    expect(moveDocument).toHaveBeenCalledWith(
      'documents/fam_1/child_1/vehicle_emergency.signed.pdf',
      'documents/fam_1/child_1/history/vehicle_emergency.signed.HIST.pdf'
    )
    const call = upsert.mock.calls[0][0]
    expect(call.update).toMatchObject(cleared)
    expect(call.update.unsignedSha256).toBe('deadbeef')
    expect(call.update.fileUrl).toBe('documents/fam_1/child_1/vehicle_emergency.pdf')
    expect(updateApp).toHaveBeenCalledWith({ where: { id: 'app_1' }, data: { documentsSignedAt: null } })
  })

  it('upload fails after the move: ERROR row with signed fields cleared and documentsSignedAt nulled', async () => {
    findUniqueDoc.mockResolvedValue(signedRow)
    uploadDocument.mockRejectedValueOnce(new Error('upload boom'))
    await generateAndStore('app_1', 'vehicle_emergency', data)
    expect(moveDocument).toHaveBeenCalledTimes(1)
    const call = upsert.mock.calls[0][0]
    expect(call.update).toMatchObject({ generationStatus: 'ERROR', ...cleared })
    expect(updateApp).toHaveBeenCalledWith({ where: { id: 'app_1' }, data: { documentsSignedAt: null } })
  })

  it('fill fails: signed copy is not archived and signed fields are untouched', async () => {
    findUniqueDoc.mockResolvedValue(signedRow)
    fillPdfMock.mockRejectedValueOnce(new Error('fill boom'))
    await generateAndStore('app_1', 'vehicle_emergency', data)
    expect(moveDocument).not.toHaveBeenCalled()
    const call = upsert.mock.calls[0][0]
    expect(call.update.generationStatus).toBe('ERROR')
    expect(call.update).not.toHaveProperty('signedFileUrl')
    expect(updateApp).not.toHaveBeenCalled()
  })

  it('non-not-found move failure: ERROR row, signed fields untouched, no upload, no app update', async () => {
    findUniqueDoc.mockResolvedValue(signedRow)
    moveDocument.mockRejectedValueOnce(new Error('network down'))
    await generateAndStore('app_1', 'vehicle_emergency', data)
    const call = upsert.mock.calls[0][0]
    expect(call.update.generationStatus).toBe('ERROR')
    expect(call.update.generationError).toMatch(/could not archive/)
    expect(call.update).not.toHaveProperty('signedFileUrl')
    expect(call.update).not.toHaveProperty('fileUrl')
    expect(updateApp).not.toHaveBeenCalled()
    expect(uploadDocument).not.toHaveBeenCalled()
  })

  it('move fails with Object not found: treated as archived, uploads and clears fields', async () => {
    findUniqueDoc.mockResolvedValue(signedRow)
    moveDocument.mockRejectedValueOnce(new Error('Object not found'))
    await generateAndStore('app_1', 'vehicle_emergency', data)
    expect(uploadDocument).toHaveBeenCalled()
    const call = upsert.mock.calls[0][0]
    expect(call.update).toMatchObject(cleared)
    expect(updateApp).toHaveBeenCalledWith({ where: { id: 'app_1' }, data: { documentsSignedAt: null } })
  })
})
