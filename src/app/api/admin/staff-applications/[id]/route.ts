// src/app/api/admin/staff-applications/[id]/route.ts
import { auth } from '@clerk/nextjs/server'
import { isAdminUser } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { VALID_STAFF_STATUSES } from '@/lib/careers'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!isAdminUser(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { status } = await req.json()

  if (!status || !(VALID_STAFF_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  await prisma.staffApplication.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json({ success: true })
}
