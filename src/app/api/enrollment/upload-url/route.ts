import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

// Parent-uploaded enrollment documents (see ApplicationDocument.documentType)
const UPLOAD_DOC_TYPES = new Set([
  "BIRTH_CERTIFICATE", "SSN_CARD", "MEDICAID_CARD", "PARENT_DL",
  "PROOF_OF_RESIDENCY", "PEACH_CARE_CARD", "FORM_3300", "FORM_3232",
]);

const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.{2,}/g, "_");

/**
 * Browsers cannot write to the private documents bucket (the anon key is
 * rightly blocked by storage RLS, and the service key must never ship to the
 * client). Instead this route mints a single-use signed upload URL for an
 * exact path; the browser then uploads the file straight to Supabase with
 * it, which also sidesteps the request-body size cap on the server.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileName, documentType, tempId } = await req.json();

  if (!fileName || !tempId || !UPLOAD_DOC_TYPES.has(documentType)) {
    return NextResponse.json(
      { error: "fileName, tempId, and a valid documentType are required" },
      { status: 400 }
    );
  }

  const path = [
    "uploads",
    userId,
    sanitize(tempId),
    documentType,
    `${Date.now()}_${sanitize(fileName)}`,
  ].join("/");

  const { data, error } = await getSupabaseAdmin().storage
    .from("documents")
    .createSignedUploadUrl(path);

  if (error || !data?.token) {
    console.error("Failed to create signed upload URL:", error);
    return NextResponse.json({ error: "Could not prepare the upload" }, { status: 502 });
  }

  return NextResponse.json({ path, token: data.token });
}
