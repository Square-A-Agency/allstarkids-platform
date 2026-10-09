import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getOwnedDocument } from '@/lib/family-auth'
import { downloadDocument } from '@/lib/documents/storage'

export async function GET(req: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { documentId } = await params
  const owned = await getOwnedDocument(documentId, userId)
  if (!owned.ok) return NextResponse.json({ error: owned.error }, { status: owned.status })

  const { doc } = owned
  if (doc.generationStatus !== 'SUCCESS' || !doc.fileUrl) {
    return NextResponse.json({ error: 'This document is still being prepared.' }, { status: 409 })
  }

  const version = new URL(req.url).searchParams.get('version')
  const path = version === 'original' || !doc.signedFileUrl ? doc.fileUrl : doc.signedFileUrl

  try {
    const bytes = await downloadDocument(path)
    const filename = path.slice(path.lastIndexOf('/') + 1)
    return new Response(bytes as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    console.error(`Document read failed for ${documentId}:`, err)
    return NextResponse.json({ error: 'Could not load the document' }, { status: 502 })
  }
}
