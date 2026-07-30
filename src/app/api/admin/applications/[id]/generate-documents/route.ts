import { auth } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin-auth";
import { generateApplicationDocuments } from "@/lib/documents/generate-documents";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!isAdminUser(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await generateApplicationDocuments(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to generate documents:", err);
    return NextResponse.json({ error: "Failed to generate documents" }, { status: 500 });
  }
}
