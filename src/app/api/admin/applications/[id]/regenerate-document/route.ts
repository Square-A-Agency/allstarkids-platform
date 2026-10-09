import { isAdmin } from "@/lib/admin-auth";
import { generateSingleDocument } from "@/lib/documents/generate-documents";
import { isSignableDocType } from "@/lib/documents/signature-lines";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { documentType } = body;

  if (!documentType || !isSignableDocType(documentType)) {
    return NextResponse.json({ error: "documentType is required and must be a valid document type" }, { status: 400 });
  }

  const confirm = body?.confirm === true;
  const existing = await prisma.applicationDocument.findUnique({
    where: { applicationId_documentType: { applicationId: id, documentType } },
  });
  if (existing?.signedAt && !confirm) {
    return NextResponse.json(
      {
        error: "This document is signed by the parent. Regenerating clears their signature and they will be asked to sign it again.",
        requiresConfirm: true,
      },
      { status: 409 }
    );
  }

  try {
    await generateSingleDocument(id, documentType);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to regenerate document:", err);
    return NextResponse.json({ error: "Failed to regenerate document" }, { status: 500 });
  }
}
