import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isAdminUser } from '../admin-auth'

const { mockAuth, mockFindUnique } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindUnique: vi.fn(),
}))

vi.mock('@clerk/nextjs/server', () => ({ auth: mockAuth }))
vi.mock('@/lib/prisma', () => ({
  prisma: { organization: { findUnique: mockFindUnique } },
}))

describe('isAdminUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.ADMIN_USER_IDS
  })

  it('authorizes org:admin of a Clerk org that is a registered tenant', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_1', orgId: 'clerk_org_1', orgRole: 'org:admin' })
    mockFindUnique.mockResolvedValue({ id: 'org_1' })
    expect(await isAdminUser('user_1')).toBe(true)
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { clerkOrgId: 'clerk_org_1' },
      select: { id: true },
    })
  })

  it('rejects org:admin of a Clerk org NOT mapped to a tenant (self-created org)', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_1', orgId: 'clerk_org_rogue', orgRole: 'org:admin' })
    mockFindUnique.mockResolvedValue(null)
    expect(await isAdminUser('user_1')).toBe(false)
  })

  it('rejects non-admin org roles without a directory lookup', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_1', orgId: 'clerk_org_1', orgRole: 'org:member' })
    expect(await isAdminUser('user_1')).toBe(false)
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('rejects when userId does not match the active session', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_2', orgId: 'clerk_org_1', orgRole: 'org:admin' })
    expect(await isAdminUser('user_1')).toBe(false)
  })

  it('rejects null userId', async () => {
    expect(await isAdminUser(null)).toBe(false)
  })

  it('honors the legacy ADMIN_USER_IDS fallback', async () => {
    process.env.ADMIN_USER_IDS = 'user_legacy, user_other'
    mockAuth.mockResolvedValue({ userId: 'user_legacy', orgId: null, orgRole: null })
    expect(await isAdminUser('user_legacy')).toBe(true)
  })

  it('falls back to legacy allowlist when org is unmapped', async () => {
    process.env.ADMIN_USER_IDS = 'user_1'
    mockAuth.mockResolvedValue({ userId: 'user_1', orgId: 'clerk_org_rogue', orgRole: 'org:admin' })
    mockFindUnique.mockResolvedValue(null)
    expect(await isAdminUser('user_1')).toBe(true)
  })
})
