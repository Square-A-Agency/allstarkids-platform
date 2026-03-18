import * as fs from 'fs'
import * as path from 'path'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import { assembleApplicationData } from './assemble-data'
import { fillPdf } from './fill-pdf'
import type { ApplicationData, FieldEntry } from './types'

// ── Document set routing ──────────────────────────────────────────────────────

type DocumentSetParams = {
  track: 'UNIVERSAL' | 'PRE_K'
  programType: string
  usesTransportation: boolean
  hasSSN: boolean
  needsExtendedDay: boolean | null
}

export function getDocumentSet(params: DocumentSetParams): string[] {
  const { track, programType, usesTransportation, hasSSN, needsExtendedDay } = params
  const docs: string[] = []

  if (track === 'UNIVERSAL') {
    docs.push('enrollment_form', 'authorization_topical', 'no_liability')
    if (programType === 'INFANT' || programType === 'TODDLER') {
      docs.push('infant_feeding')
    }
  } else {
    // PRE_K
    docs.push('prek_child_reg', 'authorization_topical', 'no_liability')
    if (!hasSSN) docs.push('ssn_information')
    if (needsExtendedDay) docs.push('caps_referral')
  }

  if (usesTransportation) {
    docs.push('transportation', 'vehicle_emergency')
  }

  return docs
}

// ── Map registry ──────────────────────────────────────────────────────────────

const MAP_REGISTRY: Record<string, string> = {
  enrollment_form:       './maps/enrollment-form',
  authorization_topical: './maps/authorization-topical',
  no_liability:          './maps/no-liability',
  infant_feeding:        './maps/infant-feeding',
  transportation:        './maps/transportation',
  vehicle_emergency:     './maps/vehicle-emergency',
  prek_child_reg:        './maps/prek-child-reg',
  ssn_information:       './maps/ssn-information',
  caps_referral:         './maps/caps-referral',
}

async function getMap(docType: string): Promise<(data: ApplicationData) => FieldEntry[]> {
  const modulePath = MAP_REGISTRY[docType]
  if (!modulePath) throw new Error(`No map registered for document type: ${docType}`)
  const mod = await import(modulePath)
  if (typeof mod.default !== 'function') throw new Error(`Map module for "${docType}" must use export default`)
  return mod.default
}

// ── PDF file loading ───────────────────────────────────────────────────────────

function loadOriginalPdf(docType: string): Uint8Array {
  const filePath = path.join(process.cwd(), 'src', 'lib', 'documents', 'originals', `${docType}.pdf`)
  return new Uint8Array(fs.readFileSync(filePath))
}

// ── Supabase upload ────────────────────────────────────────────────────────────

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function uploadToStorage(
  supabase: ReturnType<typeof getSupabaseClient>,
  familyId: string,
  childId: string,
  docType: string,
  pdfBytes: Uint8Array
): Promise<string> {
  const storagePath = `documents/${familyId}/${childId}/${docType}.pdf`
  const { error } = await supabase.storage
    .from('documents')
    .upload(storagePath, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    })
  if (error) throw new Error(`Supabase upload failed for ${docType}: ${error.message}`)
  return storagePath
}

// ── Per-document generation (shared by both orchestrators) ────────────────────

async function generateAndStore(
  applicationId: string,
  docType: string,
  data: ApplicationData,
  supabase: ReturnType<typeof getSupabaseClient>
): Promise<void> {
  let generationStatus: 'SUCCESS' | 'ERROR' = 'SUCCESS'
  let generationError: string | null = null
  let fileUrl = ''

  try {
    const mapFn = await getMap(docType)
    const fields = mapFn(data)
    const originalBytes = loadOriginalPdf(docType)
    const filledBytes = await fillPdf(originalBytes, fields)
    fileUrl = await uploadToStorage(supabase, data.familyId, data.childId, docType, filledBytes)
  } catch (err) {
    generationStatus = 'ERROR'
    generationError = err instanceof Error ? err.message : String(err)
    console.error(`Document generation failed for ${docType} (application ${applicationId}):`, err)
  }

  await prisma.applicationDocument.upsert({
    where: { applicationId_documentType: { applicationId, documentType: docType } },
    update: { generationStatus, generationError, ...(fileUrl ? { fileUrl, fileName: `${docType}.pdf`, mimeType: 'application/pdf' } : {}) },
    create: { applicationId, documentType: docType, fileName: `${docType}.pdf`, fileUrl, mimeType: 'application/pdf', generationStatus, generationError },
  })
}

// ── Main orchestrator ─────────────────────────────────────────────────────────

export async function generateApplicationDocuments(applicationId: string): Promise<void> {
  const application = await prisma.enrollmentApplication.findUniqueOrThrow({
    where: { id: applicationId },
    include: { child: true, family: true },
  })

  const data = assembleApplicationData(application as any)

  const docTypes = getDocumentSet({
    track: application.track as 'UNIVERSAL' | 'PRE_K',
    programType: application.child.programType,
    usesTransportation: application.usesTransportation,
    hasSSN: !!(application.preKSsn && application.preKSsn !== ''),
    needsExtendedDay: application.needsExtendedDay,
  })

  const supabase = getSupabaseClient()

  for (const docType of docTypes) {
    await generateAndStore(applicationId, docType, data, supabase)
  }
}

// ── Single-document regeneration ─────────────────────────────────────────────

export async function generateSingleDocument(applicationId: string, docType: string): Promise<void> {
  const application = await prisma.enrollmentApplication.findUniqueOrThrow({
    where: { id: applicationId },
    include: { child: true, family: true },
  })

  const data = assembleApplicationData(application as any)
  const supabase = getSupabaseClient()
  await generateAndStore(applicationId, docType, data, supabase)
}
