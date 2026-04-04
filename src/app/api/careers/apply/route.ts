// src/app/api/careers/apply/route.ts
//
// NOTE (manual step): In Supabase dashboard → Storage → New bucket,
// create a bucket named "resumes" with Public access enabled.
//
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'
import { validateStaffApplicationPayload } from '@/lib/careers'

export async function POST(req: Request) {
  const formData = await req.formData()

  const payload = {
    role:         formData.get('role'),
    firstName:    formData.get('firstName'),
    lastName:     formData.get('lastName'),
    email:        formData.get('email'),
    phone:        formData.get('phone'),
    yearsExp:     Number(formData.get('yearsExp')),
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

  // Handle optional resume upload
  let resumeUrl: string | undefined
  const resumeFile = formData.get('resume') as File | null
  if (resumeFile && resumeFile.size > 0) {
    const ext = resumeFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, resumeFile, { contentType: resumeFile.type })
    if (uploadError) {
      return NextResponse.json({ error: 'Resume upload failed' }, { status: 500 })
    }
    const { data } = supabase.storage.from('resumes').getPublicUrl(fileName)
    resumeUrl = data.publicUrl
  }

  await prisma.staffApplication.create({
    data: {
      role:         payload.role as string,
      firstName:    payload.firstName as string,
      lastName:     payload.lastName as string,
      email:        payload.email as string,
      phone:        payload.phone as string,
      yearsExp:     payload.yearsExp as number,
      availability: payload.availability as string,
      refOneName:   payload.refOneName as string,
      refOnePhone:  payload.refOnePhone as string,
      refTwoName:   payload.refTwoName as string,
      refTwoPhone:  payload.refTwoPhone as string,
      coverNote:    payload.coverNote as string,
      linkedinUrl:  payload.linkedinUrl as string | undefined,
      resumeUrl,
    },
  })

  return NextResponse.json({ success: true })
}
