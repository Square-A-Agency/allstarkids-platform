import { isAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status, rejectionReason } = await req.json();

  const VALID_STATUSES = ["PENDING", "UNDER_REVIEW", "PLAYDATE_SCHEDULED", "ACCEPTED", "REJECTED"];
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid or missing status" }, { status: 400 });
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
