import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { randomBytes } from 'node:crypto'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    family: { findUnique: vi.fn(), update: vi.fn() },
    child: { create: vi.fn() },
    enrollmentApplication: { create: vi.fn() },
    applicationDocument: { createMany: vi.fn() },
    enrollmentDraft: { deleteMany: vi.fn() },
  },
}))

vi.mock('@/lib/resend', () => ({
  resend: { emails: { send: vi.fn().mockResolvedValue({}) } },
}))

vi.mock('@/lib/documents/generate-documents', () => ({
  generateApplicationDocuments: vi.fn().mockResolvedValue(undefined),
}))

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { POST } from '../route'

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const mockFamilyFind = prisma.family.findUnique as ReturnType<typeof vi.fn>
const mockFamilyUpdate = prisma.family.update as ReturnType<typeof vi.fn>
const mockDraftDelete = prisma.enrollmentDraft.deleteMany as ReturnType<typeof vi.fn>
const mockChildCreate = prisma.child.create as ReturnType<typeof vi.fn>
const mockApplicationCreate = prisma.enrollmentApplication.create as ReturnType<typeof vi.fn>

beforeAll(() => {
  process.env.SSN_ENCRYPTION_KEY = randomBytes(32).toString('base64')
})

const familyInfo = {
  firstName: 'Ann', lastName: 'Alpha', email: 'ann@x.test', phone: '5550100',
  address: '1 Main St', city: 'Decatur', state: 'GA', zip: '30030',
  parent2FirstName: '', parent2LastName: '', parent2Email: '', parent2Phone: '',
  parent2WorkPhone: '', parent2Employer: '', parent2EmployerAddress: '',
}

function submitRequest() {
  return new Request('https://example.com/api/enrollment/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      familyInfo,
      children: [],
      signature: 'Ann Alpha',
      signatureDate: '2026-08-04',
    }),
  })
}

describe('POST /api/enrollment/submit draft cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_parent' })
    mockFamilyFind.mockResolvedValue({ id: 'fam_1' })
    mockDraftDelete.mockResolvedValue({ count: 1 })
    mockChildCreate.mockResolvedValue({ id: 'child_1' })
    mockApplicationCreate.mockResolvedValue({ id: 'app_1' })
  })

  it('deletes the caller draft after a successful submission', async () => {
    const res = await POST(submitRequest())
    expect(res.status).toBe(200)
    expect(mockDraftDelete).toHaveBeenCalledWith({ where: { clerkUserId: 'user_parent' } })
  })

  it('still succeeds when draft cleanup fails', async () => {
    mockDraftDelete.mockRejectedValue(new Error('db down'))
    const res = await POST(submitRequest())
    expect((await res.json()).success).toBe(true)
  })

  it('stores the child SSN encrypted, never in plain text', async () => {
    const req = new Request('https://example.com/api/enrollment/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        familyInfo,
        children: [{ firstName: 'Amy', lastName: 'Alpha', dateOfBirth: '2022-03-14', sex: 'F', programType: 'PRE_K', track: 'PRE_K', preKSsn: '123-45-6789' }],
        signature: 'Ann Alpha',
        signatureDate: '2026-08-04',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const stored = (prisma.enrollmentApplication.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data.preKSsn
    expect(stored).toMatch(/^enc:v1:/)
    expect(stored).not.toContain('6789')
  })

  it('returns 503 before any write when SSN encryption is unavailable', async () => {
    const savedKey = process.env.SSN_ENCRYPTION_KEY
    delete process.env.SSN_ENCRYPTION_KEY
    try {
      const req = new Request('https://example.com/api/enrollment/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          familyInfo,
          children: [{ firstName: 'Amy', lastName: 'Alpha', dateOfBirth: '2022-03-14', sex: 'F', programType: 'PRE_K', track: 'PRE_K', preKSsn: '123-45-6789' }],
          signature: 'Ann Alpha',
          signatureDate: '2026-08-04',
        }),
      })
      const res = await POST(req)
      expect(res.status).toBe(503)
      expect(mockFamilyUpdate).not.toHaveBeenCalled()
      expect(mockChildCreate).not.toHaveBeenCalled()
    } finally {
      process.env.SSN_ENCRYPTION_KEY = savedKey
    }
  })
})
