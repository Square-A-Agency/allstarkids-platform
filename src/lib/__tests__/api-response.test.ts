import { describe, it, expect } from 'vitest'
import { readApiError } from '../api-response'

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
