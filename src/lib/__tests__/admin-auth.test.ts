import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}))

import { auth, currentUser } from '@clerk/nextjs/server'
import { isAdminUser, isAdmin } from '../admin-auth'

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const mockCurrentUser = currentUser as unknown as ReturnType<typeof vi.fn>

function clerkUser(emails: Array<{ address: string; verified: boolean }>) {
  return {
    emailAddresses: emails.map((e) => ({
      emailAddress: e.address,
      verification: { status: e.verified ? 'verified' : 'unverified' },
    })),
  }
}

describe('isAdminUser (ID allowlist)', () => {
  beforeEach(() => {
    process.env.ADMIN_USER_IDS = 'user_a, user_b'
  })

  it('accepts a listed user ID', () => {
    expect(isAdminUser('user_a')).toBe(true)
    expect(isAdminUser('user_b')).toBe(true)
  })

  it('rejects unlisted or missing user IDs', () => {
    expect(isAdminUser('user_c')).toBe(false)
    expect(isAdminUser(null)).toBe(false)
  })
})

describe('isAdmin (ID + email allowlists)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_USER_IDS = 'user_a'
    process.env.ADMIN_EMAILS = 'Omorakinyo@AllStarKidsAcademyGA.com, other@example.com'
  })

  it('returns false when not signed in, without calling currentUser', async () => {
    mockAuth.mockResolvedValue({ userId: null })

    expect(await isAdmin()).toBe(false)
    expect(mockCurrentUser).not.toHaveBeenCalled()
  })

  it('returns true for an allowlisted user ID without calling currentUser', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_a' })

    expect(await isAdmin()).toBe(true)
    expect(mockCurrentUser).not.toHaveBeenCalled()
  })

  it('returns true for a verified email on the allowlist, case-insensitively', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_mom' })
    mockCurrentUser.mockResolvedValue(
      clerkUser([{ address: 'omorakinyo@allstarkidsacademyga.com', verified: true }])
    )

    expect(await isAdmin()).toBe(true)
  })

  it('returns false when the matching email is unverified', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_impostor' })
    mockCurrentUser.mockResolvedValue(
      clerkUser([{ address: 'omorakinyo@allstarkidsacademyga.com', verified: false }])
    )

    expect(await isAdmin()).toBe(false)
  })

  it('returns false when no email matches', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_random' })
    mockCurrentUser.mockResolvedValue(clerkUser([{ address: 'nobody@gmail.com', verified: true }]))

    expect(await isAdmin()).toBe(false)
  })

  it('checks any verified email on the account, not just the first', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_mom' })
    mockCurrentUser.mockResolvedValue(
      clerkUser([
        { address: 'personal@gmail.com', verified: true },
        { address: 'omorakinyo@allstarkidsacademyga.com', verified: true },
      ])
    )

    expect(await isAdmin()).toBe(true)
  })

  it('skips the Clerk user lookup entirely when ADMIN_EMAILS is unset', async () => {
    delete process.env.ADMIN_EMAILS
    mockAuth.mockResolvedValue({ userId: 'user_random' })

    expect(await isAdmin()).toBe(false)
    expect(mockCurrentUser).not.toHaveBeenCalled()
  })
})
