import { describe, it, expect } from 'vitest'
import { readApiError, readJsonOrError } from '../api-response'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function htmlResponse(status = 200) {
  return new Response('<!DOCTYPE html><html><body>Sign in</body></html>', {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}

describe('readApiError', () => {
  it('returns null for a successful JSON response', async () => {
    expect(await readApiError(jsonResponse({ success: true }))).toBeNull()
  })

  it('returns the error message from a JSON error response', async () => {
    expect(await readApiError(jsonResponse({ error: 'Failed to generate documents' }, 500))).toBe(
      'Failed to generate documents'
    )
  })

  it('returns a status-based message for a JSON error response without an error field', async () => {
    const msg = await readApiError(jsonResponse({}, 500))
    expect(msg).toMatch(/500/)
  })

  it('returns a session-expired message for an HTML 404 (Clerk middleware rejection)', async () => {
    const msg = await readApiError(htmlResponse(404))
    expect(msg).toMatch(/session/i)
    expect(msg).not.toMatch(/DOCTYPE/)
  })

  it('returns a session-expired message for an HTML 401', async () => {
    const msg = await readApiError(htmlResponse(401))
    expect(msg).toMatch(/session/i)
  })

  it('never surfaces raw HTML even for other non-JSON statuses', async () => {
    const msg = await readApiError(htmlResponse(504))
    expect(msg).toBeTruthy()
    expect(msg).not.toMatch(/DOCTYPE/)
  })
})

describe('readJsonOrError', () => {
  it('returns parsed data for a successful JSON response, reading the body exactly once', async () => {
    const res = jsonResponse({ path: 'a/b', token: 'tok' })
    const out = await readJsonOrError<{ path: string; token: string }>(res)
    expect(out.data).toEqual({ path: 'a/b', token: 'tok' })
    expect(out.error).toBeUndefined()
  })

  it('returns the JSON error message for a failed JSON response', async () => {
    const out = await readJsonOrError(jsonResponse({ error: 'Unauthorized' }, 401))
    expect(out.error).toBe('Unauthorized')
    expect(out.data).toBeUndefined()
  })

  it('returns a session message for an HTML response without throwing on double read', async () => {
    const out = await readJsonOrError(htmlResponse(404))
    expect(out.error).toMatch(/session/i)
  })

  it('returns an error when a 200 response has an unparseable body', async () => {
    const res = new Response('not json', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
    const out = await readJsonOrError(res)
    expect(out.error).toBeTruthy()
  })
})
