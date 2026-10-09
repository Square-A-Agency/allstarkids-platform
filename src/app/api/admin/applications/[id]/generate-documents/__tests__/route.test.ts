import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
const count = vi.hoisted(() => vi.fn())
vi.mock('@/lib/prisma', () => ({ prisma: { applicationDocument: { count } } }))
const generateApplicationDocuments = vi.hoisted(() => vi.fn())
vi.mock('@/lib/documents/generate-documents', () => ({ generateApplicationDocuments }))

import { auth } from '@clerk/nextjs/server'
import { POST } from '../route'

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const params = () => ({ params: Promise.resolve({ id: 'app_1' }) })
const req = (body?: unknown) =>
  new Request('https://example.com/api/admin/applications/app_1/generate-documents', {
    method: 'POST',
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

describe('POST generate-documents signature guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_USER_IDS = 'admin_user'
    mockAuth.mockResolvedValue({ userId: 'admin_user' })
  })

  it('generates when nothing is signed, even with no body', async () => {
    count.mockResolvedValue(0)
    expect((await POST(req(), params())).status).toBe(200)
    expect(generateApplicationDocuments).toHaveBeenCalledWith('app_1')
  })

  it('409 with requiresConfirm when any document is signed', async () => {
    count.mockResolvedValue(2)
    const res = await POST(req({}), params())
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ requiresConfirm: true })
    expect(generateApplicationDocuments).not.toHaveBeenCalled()
  })

  it('generates signed applications with confirm: true', async () => {
    count.mockResolvedValue(2)
    expect((await POST(req({ confirm: true }), params())).status).toBe(200)
    expect(generateApplicationDocuments).toHaveBeenCalled()
  })
})
