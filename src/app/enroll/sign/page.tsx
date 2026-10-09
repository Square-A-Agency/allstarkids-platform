import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isSignableDocType } from "@/lib/documents/signature-lines";
import { documentLabel } from "@/lib/documents/labels";
import SigningSession, { type SigningApplication } from "@/components/enrollment/SigningSession";

export default async function SignDocumentsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const family = await prisma.family.findUnique({
    where: { clerkUserId: userId },
    include: {
      applications: {
        include: { child: true, documents: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!family) redirect("/onboarding");

  const applications: SigningApplication[] = family.applications
    .filter((app) => app.status !== "REJECTED")
    .map((app) => ({
      id: app.id,
      childName: `${app.child.firstName} ${app.child.lastName}`,
      documents: app.documents
        .filter((d) => isSignableDocType(d.documentType))
        .sort((a, b) => a.documentType.localeCompare(b.documentType))
        .map((d) => ({
          id: d.id,
          documentType: d.documentType,
          label: documentLabel(d.documentType),
          status:
            d.generationStatus !== "SUCCESS" || !d.fileUrl ? ("preparing" as const)
            : d.signedAt ? ("signed" as const)
            : ("to_sign" as const),
          signedAt: d.signedAt ? d.signedAt.toISOString() : null,
        })),
    }))
    .filter((app) => app.documents.length > 0);

  const needsConsent = family.applications.some((a) => a.status !== "REJECTED" && !a.eSignConsentAt);

  return (
    <div>
      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-14 text-center">
          <p className="font-bold text-slate-700 text-lg">Nothing to sign yet</p>
          <p className="text-sm text-slate-400 mt-1">Submit an enrollment application first.</p>
          <Link href="/enroll" className="inline-block mt-5 text-sm font-semibold text-blue-600">Start enrollment</Link>
        </div>
      ) : (
        <SigningSession needsConsent={needsConsent} applications={applications} />
      )}
    </div>
  );
}
