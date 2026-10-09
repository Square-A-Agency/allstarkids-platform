import { isAdmin } from "@/lib/admin-auth";
import { generateApplicationDocuments } from "@/lib/documents/generate-documents";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Filling and uploading up to nine PDFs can exceed the default function
// duration on Vercel; give the route explicit headroom.
export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const confirm = body?.confirm === true;
  const signedCount = await prisma.applicationDocument.count({
    where: { applicationId: id, signedAt: { not: null } },
  });
  if (signedCount > 0 && !confirm) {
    return NextResponse.json(
      {
        error: `${signedCount} document${signedCount === 1 ? " is" : "s are"} signed by the parent. Regenerating clears those signatures and they will be asked to sign again.`,
        requiresConfirm: true,
      },
      { status: 409 }
    );
  }

  try {
    await generateApplicationDocuments(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to generate documents:", err);
    return NextResponse.json({ error: "Failed to generate documents" }, { status: 500 });
  }
}
