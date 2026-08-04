// src/app/api/admin/staff-applications/[id]/route.ts
import { isAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'
import { NextResponse } from 'next/server'
import { VALID_STAFF_STATUSES } from '@/lib/careers'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { status } = await req.json()

  if (!status || !(VALID_STAFF_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  try {
    await prisma.staffApplication.update({
      where: { id },
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
