/**
 * Reads an API response and returns a human-readable error message,
 * or null if the response is a successful JSON response.
 *
 * Guards against non-JSON bodies (e.g. the HTML sign-in page Clerk's
 * middleware serves when the session token has expired) so the raw
 * "<!DOCTYPE ..." never reaches an alert.
 */
export async function readApiError(res: Response): Promise<string | null> {
  const isJson = (res.headers.get("content-type") ?? "").includes("application/json");

  if (isJson) {
    try {
      const body = await res.json();
      if (!res.ok || body?.error) {
        return body?.error ?? `Request failed (status ${res.status})`;
      }
      return null;
    } catch {
      return `Request failed (status ${res.status})`;
    }
  }

  if (res.status === 401 || res.status === 404) {
    return "Your session has expired. Refresh the page, sign in again, and retry.";
  }

  return `The server returned an unexpected response (status ${res.status}). Refresh the page and try again.`;
}

/**
 * Reads a response body exactly once and returns either the parsed JSON
 * payload or a human-readable error. Use this instead of calling
 * readApiError and res.json() on the same response: a Response body is a
 * stream and a second read throws "body stream already read".
 */
export async function readJsonOrError<T>(res: Response): Promise<{ data?: T; error?: string }> {
  const isJson = (res.headers.get("content-type") ?? "").includes("application/json");

  if (res.ok && isJson) {
    try {
      return { data: (await res.json()) as T };
    } catch {
      return { error: "The server returned an unreadable response. Please try again." };
    }
  }

  return { error: (await readApiError(res)) ?? `Request failed (status ${res.status})` };
}
