import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const BUCKET = 'documents'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export function getDocumentsBucket() {
  return getSupabaseClient().storage.from(BUCKET)
}

export async function uploadDocument(path: string, bytes: Uint8Array): Promise<void> {
  const { error } = await getDocumentsBucket().upload(path, bytes, {
    contentType: 'application/pdf',
    upsert: true,
  })
  if (error) throw new Error(`Supabase upload failed for ${path}: ${error.message}`)
}

export async function downloadDocument(path: string): Promise<Uint8Array> {
  const { data, error } = await getDocumentsBucket().download(path)
  if (error || !data) throw new Error(`Supabase download failed for ${path}: ${error?.message ?? 'no data'}`)
  return new Uint8Array(await data.arrayBuffer())
}

export async function moveDocument(from: string, to: string): Promise<void> {
  const { error } = await getDocumentsBucket().move(from, to)
  if (error) throw new Error(`Supabase move failed ${from} -> ${to}: ${error.message}`)
}

export async function createSignedDocumentUrl(path: string, expiresSeconds = 60): Promise<string> {
  const { data, error } = await getDocumentsBucket().createSignedUrl(path, expiresSeconds)
  if (error || !data?.signedUrl) throw new Error(`Could not sign URL for ${path}: ${error?.message ?? 'no url'}`)
  return data.signedUrl
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

/** documents/f/c/x.signed.pdf -> documents/f/c/history/x.signed.2026-10-12T14-05-09.pdf */
export function historyPathFor(signedPath: string, at: Date): string {
  const stamp = at.toISOString().replace(/\.\d{3}Z$/, '').replace(/:/g, '-')
  const slash = signedPath.lastIndexOf('/')
  const dir = signedPath.slice(0, slash)
  const file = signedPath.slice(slash + 1).replace(/\.pdf$/, '')
  return `${dir}/history/${file}.${stamp}.pdf`
}
