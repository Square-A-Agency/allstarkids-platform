'use server'

import { auth } from '@clerk/nextjs/server'
import { isAdminUser } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createJobOpening(formData: FormData) {
  const { userId } = await auth()
  if (!isAdminUser(userId)) throw new Error('Unauthorized')

  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string).trim()
  const icon = (formData.get('icon') as string) || 'Users'
  const accentColor = (formData.get('accentColor') as string) || '#6366f1'

  if (!title || !description) throw new Error('Title and description are required')

  await prisma.jobOpening.create({ data: { title, description, icon, accentColor } })
  revalidatePath('/admin/job-openings')
  revalidatePath('/careers')
}

export async function deleteJobOpening(id: string) {
  const { userId } = await auth()
  if (!isAdminUser(userId)) throw new Error('Unauthorized')

  await prisma.jobOpening.delete({ where: { id } })
  revalidatePath('/admin/job-openings')
  revalidatePath('/careers')
}
