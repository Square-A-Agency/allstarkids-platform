import { describe, it, expect, beforeEach, vi } from 'vitest'

// Regression test for the production /enroll crash: client components import
// @/lib/supabase, so evaluating that module must never require server-only
// env vars. In the browser SUPABASE_SERVICE_ROLE_KEY is always undefined.
describe('lib/supabase', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
  })

  it('imports without throwing when SUPABASE_SERVICE_ROLE_KEY is absent (browser condition)', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    const mod = await import('@/lib/supabase')
    expect(mod.supabase).toBeDefined()
  })

  it('does not export a service-role client from the shared module', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    const mod = await import('@/lib/supabase')
    expect('supabaseAdmin' in mod).toBe(false)
  })
})

describe('lib/supabase-admin', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  })

  it('creates the admin client lazily with the service role key', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    const { getSupabaseAdmin } = await import('@/lib/supabase-admin')
    const client = getSupabaseAdmin()
    expect(client).toBeDefined()
    expect(getSupabaseAdmin()).toBe(client)
  })

  it('importing the module does not throw when the key is absent; only calling does', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    const { getSupabaseAdmin } = await import('@/lib/supabase-admin')
    expect(() => getSupabaseAdmin()).toThrow()
  })
})
