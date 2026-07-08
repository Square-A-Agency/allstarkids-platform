import { auth } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin-auth";
import { requireOrg } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { generateApplicationDocuments } from "@/lib/documents/generate-documents";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!(await isAdminUser(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const { orgId } = await requireOrg();
  const owned = await prisma.enrollmentApplication.findUnique({
    where: { id, organizationId: orgId },
    select: { id: true },
  });
  if (!owned) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await generateApplicationDocuments(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to generate documents:", err);
    return NextResponse.json({ error: "Failed to generate documents" }, { status: 500 });
  }
}
