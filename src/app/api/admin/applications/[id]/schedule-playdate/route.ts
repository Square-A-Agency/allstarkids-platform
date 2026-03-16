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
  const { date, notes } = await req.json();

  if (!date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }

  await prisma.enrollmentApplication.update({
    where: { id },
    data: {
      playdateScheduledAt: new Date(date),
      playdateNotes: notes || null,
      status: "PLAYDATE_SCHEDULED",
    },
  });

  return NextResponse.json({ success: true });
}
