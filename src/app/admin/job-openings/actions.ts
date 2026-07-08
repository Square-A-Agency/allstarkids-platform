'use server'

import { auth } from '@clerk/nextjs/server'
import { isAdminUser } from '@/lib/admin-auth'
import { requireOrg } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'
import { revalidatePath } from 'next/cache'

export async function createJobOpening(formData: FormData) {
  const { userId } = await auth()
  if (!(await isAdminUser(userId))) throw new Error('Unauthorized')

  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string).trim()
  const icon = (formData.get('icon') as string) || 'Users'
  const accentColor = (formData.get('accentColor') as string) || '#6366f1'

  if (!title || !description) throw new Error('Title and description are required')

  const { orgId } = await requireOrg()
  await prisma.jobOpening.create({ data: { organizationId: orgId, title, description, icon, accentColor } })
  revalidatePath('/admin/job-openings')
  revalidatePath('/careers')
}

export async function deleteJobOpening(id: string) {
  const { userId } = await auth()
  if (!(await isAdminUser(userId))) throw new Error('Unauthorized')

  const { orgId } = await requireOrg()
  try {
    await prisma.jobOpening.delete({ where: { id, organizationId: orgId } })
  } catch (error: unknown) {
    // Already deleted (or not this org's): treat as done, still revalidate
    // so a stale admin view refreshes.
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')) {
      throw error
    }
  }
  revalidatePath('/admin/job-openings')
  revalidatePath('/careers')
}
