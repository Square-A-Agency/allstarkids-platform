import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    firstName, lastName, email, phone,
    address, city, state, zip,
    parent2FirstName, parent2LastName, parent2Email,
    parent2Phone, parent2Employer,
  } = body;

  if (!firstName || !lastName || !email || !phone || !address || !city || !zip) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const family = await prisma.family.upsert({
      where: { clerkUserId: userId },
      create: {
        clerkUserId: userId,
        firstName, lastName, email, phone,
        address, city, state: state || "GA", zip,
        parent2FirstName: parent2FirstName || null,
        parent2LastName: parent2LastName || null,
        parent2Email: parent2Email || null,
        parent2Phone: parent2Phone || null,
        parent2Employer: parent2Employer || null,
      },
      update: {
        firstName, lastName, email, phone,
        address, city, state: state || "GA", zip,
        parent2FirstName: parent2FirstName || null,
        parent2LastName: parent2LastName || null,
        parent2Email: parent2Email || null,
        parent2Phone: parent2Phone || null,
        parent2Employer: parent2Employer || null,
      },
    });
    return NextResponse.json({ family });
  } catch (err) {
    console.error("Family create error:", err);
    return NextResponse.json({ error: "Failed to create family profile" }, { status: 500 });
  }
}
