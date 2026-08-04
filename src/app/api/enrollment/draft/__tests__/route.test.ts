import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { randomBytes } from 'node:crypto'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    enrollmentDraft: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { GET, PUT, DELETE } from '../route'

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const mockFindUnique = prisma.enrollmentDraft.findUnique as ReturnType<typeof vi.fn>
const mockUpsert = prisma.enrollmentDraft.upsert as ReturnType<typeof vi.fn>
const mockDeleteMany = prisma.enrollmentDraft.deleteMany as ReturnType<typeof vi.fn>

const wizardState = { step: 3, familyInfo: { firstName: 'Ann' }, children: [] }

beforeAll(() => {
  process.env.SSN_ENCRYPTION_KEY = randomBytes(32).toString('base64')
})

function putRequest(body: unknown) {
  return new Request('https://example.com/api/enrollment/draft', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('/api/enrollment/draft', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_parent' })
  })

  it('GET returns 401 when not signed in', async () => {
    mockAuth.mockResolvedValue({ userId: null })
    expect((await GET()).status).toBe(401)
  })

  it('GET returns null when no draft exists', async () => {
    mockFindUnique.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(200)
    expect((await res.json()).draft).toBeNull()
  })

  it('GET returns the stored wizard state', async () => {
    mockFindUnique.mockResolvedValue({ data: wizardState })
    expect((await (await GET()).json()).draft).toEqual(wizardState)
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { clerkUserId: 'user_parent' } })
  })

  it('PUT upserts the draft keyed by the caller', async () => {
    const res = await PUT(putRequest(wizardState))
    expect(res.status).toBe(200)
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { clerkUserId: 'user_parent' },
      update: { data: wizardState },
      create: { clerkUserId: 'user_parent', data: wizardState },
    })
  })

  it('PUT rejects malformed bodies with 400', async () => {
    expect((await PUT(putRequest({ nope: true }))).status).toBe(400)
    expect((await PUT(putRequest('garbage'))).status).toBe(400)
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('DELETE removes the caller draft and is idempotent', async () => {
    mockDeleteMany.mockResolvedValue({ count: 0 })
    const res = await DELETE()
    expect(res.status).toBe(200)
    expect(mockDeleteMany).toHaveBeenCalledWith({ where: { clerkUserId: 'user_parent' } })
  })

  it('PUT stores children SSNs encrypted and GET returns them decrypted', async () => {
    const withSsn = { step: 4, familyInfo: { firstName: 'Ann' }, children: [{ firstName: 'Amy', preKSsn: '123-45-6789' }] }
    await PUT(putRequest(withSsn))
    const saved = mockUpsert.mock.calls[0][0].create.data
    expect(saved.children[0].preKSsn).toMatch(/^enc:v1:/)

    mockFindUnique.mockResolvedValue({ data: saved })
    const body = await (await GET()).json()
    expect(body.draft.children[0].preKSsn).toBe('123-45-6789')
  })

  it('GET returns the raw value instead of throwing when a stored SSN cannot be decrypted', async () => {
    const corrupt = { step: 4, familyInfo: { firstName: 'Ann' }, children: [{ firstName: 'Amy', preKSsn: 'enc:v1:AAAA:BBBB:CCCC' }] }
    mockFindUnique.mockResolvedValue({ data: corrupt })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.draft.children[0].preKSsn).toBe('enc:v1:AAAA:BBBB:CCCC')
    expect(body.draft.familyInfo).toEqual(corrupt.familyInfo)
  })

  it('PUT returns 503 before any write when SSN encryption is unavailable', async () => {
    const savedKey = process.env.SSN_ENCRYPTION_KEY
    delete process.env.SSN_ENCRYPTION_KEY
    try {
      const withSsn = { step: 4, familyInfo: { firstName: 'Ann' }, children: [{ firstName: 'Amy', preKSsn: '123-45-6789' }] }
      const res = await PUT(putRequest(withSsn))
      expect(res.status).toBe(503)
      expect(mockUpsert).not.toHaveBeenCalled()
    } finally {
      process.env.SSN_ENCRYPTION_KEY = savedKey
    }
  })
})
