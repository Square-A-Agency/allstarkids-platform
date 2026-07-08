import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOrg } from '@/lib/tenant'

export async function GET() {
  const { orgId } = await requireOrg()
  const openings = await prisma.jobOpening.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'asc' } })
  return NextResponse.json(openings)
}
