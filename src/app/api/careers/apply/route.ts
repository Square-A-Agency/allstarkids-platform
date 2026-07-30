// src/app/api/careers/apply/route.ts
//
// NOTE (manual step): In Supabase dashboard → Storage → New bucket,
// create a bucket named "resumes" with Public access enabled.
//
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { validateStaffApplicationPayload } from '@/lib/careers'
export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin()
  const formData = await req.formData()

  const rawYearsExp = formData.get('yearsExp')

  const payload = {
    role:         formData.get('role'),
    firstName:    formData.get('firstName'),
    lastName:     formData.get('lastName'),
    email:        formData.get('email'),
    phone:        formData.get('phone'),
    yearsExp:     rawYearsExp === null || rawYearsExp === '' ? NaN : Number(rawYearsExp),
    availability: formData.get('availability'),
    refOneName:   formData.get('refOneName'),
    refOnePhone:  formData.get('refOnePhone'),
    refTwoName:   formData.get('refTwoName'),
    refTwoPhone:  formData.get('refTwoPhone'),
    coverNote:    formData.get('coverNote'),
    linkedinUrl:  formData.get('linkedinUrl') || undefined,
  } as Record<string, unknown>

  const error = validateStaffApplicationPayload(payload)
  if (error) {
    return NextResponse.json({ error }, { status: 400 })
  }

  // Validate role against current DB openings
  const openings = await prisma.jobOpening.findMany({ select: { title: true } })
  const validTitles = openings.map((o) => o.title)
  if (!validTitles.includes(payload.role as string)) {
    return NextResponse.json({ error: 'Invalid role: position is no longer available' }, { status: 400 })
  }

  // After validation, types are guaranteed
  const validated = payload as {
    role: string; firstName: string; lastName: string; email: string
    phone: string; yearsExp: number; availability: string
    refOneName: string; refOnePhone: string; refTwoName: string
    refTwoPhone: string; coverNote: string; linkedinUrl?: string
  }

  // Handle optional resume upload — failure does not block submission
  let resumeUrl: string | undefined
  const resumeFile = formData.get('resume') as File | null
  if (resumeFile && resumeFile.size > 0) {
    const ext = resumeFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadError } = await supabaseAdmin.storage
      .from('resumes')
      .upload(fileName, resumeFile, { contentType: resumeFile.type })
    if (uploadError) {
      console.error('Resume upload failed (non-blocking):', uploadError.message)
    } else {
      const { data } = supabaseAdmin.storage.from('resumes').getPublicUrl(fileName)
      resumeUrl = data.publicUrl
    }
  }

  try {
    await prisma.staffApplication.create({
      data: {
        role:         validated.role,
        firstName:    validated.firstName,
        lastName:     validated.lastName,
        email:        validated.email,
        phone:        validated.phone,
        yearsExp:     validated.yearsExp,
        availability: validated.availability,
        refOneName:   validated.refOneName,
        refOnePhone:  validated.refOnePhone,
        refTwoName:   validated.refTwoName,
        refTwoPhone:  validated.refTwoPhone,
        coverNote:    validated.coverNote,
        linkedinUrl:  validated.linkedinUrl,
        resumeUrl,
      },
    })
  } catch {
    // If resume was uploaded, clean up the orphaned file
    if (resumeUrl) {
      const fileName = resumeUrl.split('/').pop()
      if (fileName) {
        await supabaseAdmin.storage.from('resumes').remove([fileName])
      }
    }
    return NextResponse.json({ error: 'Failed to submit application. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
