import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/tenant', () => ({
  requireOrg: vi.fn().mockResolvedValue({ orgId: 'org_test', slug: 'test' }),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    jobOpening: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import { GET } from '../route'

const mockFindMany = prisma.jobOpening.findMany as ReturnType<typeof vi.fn>

describe('GET /api/careers/openings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns openings as JSON with 200', async () => {
    const openings = [
      { id: '1', title: 'Teacher (1 Year Olds)', description: 'Teach 1-year-olds.', icon: 'Heart', accentColor: '#f43f5e', createdAt: new Date() },
      { id: '2', title: 'Bus Driver', description: 'Drive the bus.', icon: 'Bus', accentColor: '#eab308', createdAt: new Date() },
    ]
    mockFindMany.mockResolvedValue(openings)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toHaveLength(2)
    expect(body[0].title).toBe('Teacher (1 Year Olds)')
    expect(body[1].title).toBe('Bus Driver')
  })

  it('returns empty array when no openings exist', async () => {
    mockFindMany.mockResolvedValue([])

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual([])
  })

  it('queries openings ordered by createdAt asc', async () => {
    mockFindMany.mockResolvedValue([])

    await GET()

    expect(mockFindMany).toHaveBeenCalledWith({ where: { organizationId: 'org_test' }, orderBy: { createdAt: 'asc' } })
  })
})
