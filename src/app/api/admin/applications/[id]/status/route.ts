import { auth } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin-auth";
import { requireOrg } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!(await isAdminUser(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status, rejectionReason } = await req.json();

  const VALID_STATUSES = ["PENDING", "UNDER_REVIEW", "PLAYDATE_SCHEDULED", "ACCEPTED", "REJECTED"];
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid or missing status" }, { status: 400 });
  }

  const { orgId } = await requireOrg();
  await prisma.enrollmentApplication.update({
    where: { id, organizationId: orgId },
    data: {
      status,
      ...(rejectionReason ? { rejectionReason } : {}),
    },
  });

  return NextResponse.json({ success: true });
}
