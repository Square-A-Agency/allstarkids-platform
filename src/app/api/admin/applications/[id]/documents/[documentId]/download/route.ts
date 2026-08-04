import { isAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, documentId } = await params;

  const doc = await prisma.applicationDocument.findUnique({
    where: { id: documentId },
  });

  if (!doc || doc.applicationId !== id || doc.generationStatus !== "SUCCESS" || !doc.fileUrl) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Signed URLs are minted per click, so a short expiry is safe here.
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.fileUrl, 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Could not create download link" }, { status: 502 });
  }

  return NextResponse.redirect(data.signedUrl, 307);
}
