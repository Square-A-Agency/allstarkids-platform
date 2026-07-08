// src/app/api/admin/staff-applications/[id]/route.ts
import { auth } from '@clerk/nextjs/server'
import { isAdminUser } from '@/lib/admin-auth'
import { requireOrg } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'
import { NextResponse } from 'next/server'
import { VALID_STAFF_STATUSES } from '@/lib/careers'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!(await isAdminUser(userId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { status } = await req.json()

  if (!status || !(VALID_STAFF_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  try {
    const { orgId } = await requireOrg()
    await prisma.staffApplication.update({
      where: { id, organizationId: orgId },
      data: { status },
    })
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }
    throw error
  }

  return NextResponse.json({ success: true })
}
