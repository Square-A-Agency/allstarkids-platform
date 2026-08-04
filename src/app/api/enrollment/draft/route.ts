import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isWizardStateShape } from "@/lib/enrollment-draft";
import { encryptSsn, decryptSsn, assertSsnCryptoReady } from "@/lib/ssn-crypto";
import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";

function mapChildrenSsn(
  state: Record<string, unknown>,
  fn: (v: string) => string
): Record<string, unknown> {
  const children = state.children;
  if (!Array.isArray(children)) return state;
  return {
    ...state,
    children: children.map((c) => {
      if (!c || typeof c !== "object") return c;
      const child = c as Record<string, unknown>;
      return typeof child.preKSsn === "string" && child.preKSsn
        ? { ...child, preKSsn: fn(child.preKSsn) }
        : child;
    }),
  };
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const draft = await prisma.enrollmentDraft.findUnique({
    where: { clerkUserId: userId },
  });
  const safeDecryptSsn = (v: string) => {
    try {
      return decryptSsn(v);
    } catch (err) {
      console.error("Failed to decrypt draft SSN, returning raw value:", err);
      return v;
    }
  };
  return NextResponse.json({
    draft: draft?.data ? mapChildrenSsn(draft.data as Record<string, unknown>, safeDecryptSsn) : null,
  });
}

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!isWizardStateShape(body)) {
    return NextResponse.json({ error: "Invalid draft payload" }, { status: 400 });
  }

  if (body.children?.some((c) => typeof c?.preKSsn === "string" && c.preKSsn)) {
    try {
      assertSsnCryptoReady();
    } catch (err) {
      console.error("SSN encryption unavailable:", err);
      return NextResponse.json(
        { error: "Saving is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }
  }

  const stored = mapChildrenSsn(body, encryptSsn) as Prisma.InputJsonValue;
  await prisma.enrollmentDraft.upsert({
    where: { clerkUserId: userId },
    update: { data: stored },
    create: { clerkUserId: userId, data: stored },
  });
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.enrollmentDraft.deleteMany({ where: { clerkUserId: userId } });
  return NextResponse.json({ success: true });
}
