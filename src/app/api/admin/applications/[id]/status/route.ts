import { auth } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!isAdminUser(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status, rejectionReason } = await req.json();

  if (!status) {
    return NextResponse.json({ error: "Status is required" }, { status: 400 });
  }

  await prisma.enrollmentApplication.update({
    where: { id },
    data: {
      status,
      ...(rejectionReason ? { rejectionReason } : {}),
    },
  });

  return NextResponse.json({ success: true });
}
