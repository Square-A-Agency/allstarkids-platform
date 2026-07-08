import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/tenant";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orgId } = await requireOrg();
  const family = await prisma.family.findUnique({
    where: { organizationId_clerkUserId: { organizationId: orgId, clerkUserId: userId } },
    include: {
      children: true,
      applications: {
        include: { child: true, documents: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!family) {
    return NextResponse.json({ error: "Family not found" }, { status: 404 });
  }

  return NextResponse.json({ family });
}
