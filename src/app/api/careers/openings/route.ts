import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const openings = await prisma.jobOpening.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json(openings)
}
