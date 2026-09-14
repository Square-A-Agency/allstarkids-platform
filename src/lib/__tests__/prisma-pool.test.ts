import { describe, it, expect } from 'vitest'
import { buildPoolConfig } from '@/lib/prisma'

// Production runs on Vercel serverless against the Supabase pooler. Every
// function instance owns its own pg Pool, and frozen instances keep their
// sockets open, so an uncapped pool exhausted the pooler's client limit
// (EMAXCONNSESSION, 2026-09-14). Keep each instance's footprint tiny.
describe('buildPoolConfig', () => {
  it('trims stray whitespace from the connection string', () => {
    expect(buildPoolConfig(' postgresql://u:p@h:6543/db\n').connectionString).toBe('postgresql://u:p@h:6543/db')
  })

  it('caps connections per instance at a small number', () => {
    const cfg = buildPoolConfig('postgresql://u:p@h:6543/db')
    expect(cfg.max).toBeLessThanOrEqual(3)
    expect(cfg.max).toBeGreaterThanOrEqual(1)
  })

  it('releases idle connections quickly and fails fast when the pooler is full', () => {
    const cfg = buildPoolConfig('postgresql://u:p@h:6543/db')
    expect(cfg.idleTimeoutMillis).toBeLessThanOrEqual(10_000)
    expect(cfg.connectionTimeoutMillis).toBeGreaterThan(0)
    expect(cfg.connectionTimeoutMillis).toBeLessThanOrEqual(10_000)
  })

  it('throws when the connection string is missing', () => {
    expect(() => buildPoolConfig(undefined)).toThrow(/DATABASE_URL/)
  })
})
