import { auth } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin-auth";
import { generateSingleDocument } from "@/lib/documents/generate-documents";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!isAdminUser(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { documentType } = await req.json();

  const VALID_DOC_TYPES = new Set([
    'enrollment_form', 'authorization_topical', 'no_liability',
    'infant_feeding', 'transportation', 'vehicle_emergency',
    'prek_child_reg', 'ssn_information', 'caps_referral',
  ])

  if (!documentType || !VALID_DOC_TYPES.has(documentType)) {
    return NextResponse.json({ error: "documentType is required and must be a valid document type" }, { status: 400 });
  }

  try {
    await generateSingleDocument(id, documentType);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to regenerate document:", err);
    return NextResponse.json({ error: "Failed to regenerate document" }, { status: 500 });
  }
}
