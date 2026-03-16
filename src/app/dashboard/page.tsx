import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  PLAYDATE_SCHEDULED: "bg-purple-100 text-purple-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending Review",
  UNDER_REVIEW: "Under Review",
  PLAYDATE_SCHEDULED: "Playdate Scheduled",
  ACCEPTED: "Accepted",
  REJECTED: "Not Accepted",
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const family = await prisma.family.findUnique({
    where: { clerkUserId: userId },
    include: {
      applications: {
        include: { child: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!family) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-blue-900">All Star Kids Academy</h1>
          <p className="text-sm text-gray-500">Family Portal</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {family.firstName} {family.lastName}
          </span>
          <Link
            href="/sign-out"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium transition-all hover:bg-muted h-7"
          >
            Sign Out
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome, {family.firstName}!
          </h2>
          <p className="text-gray-500 mt-1">
            Manage your children&apos;s enrollment applications below.
          </p>
        </div>

        {/* Start enrollment CTA */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-900">Ready to enroll a child?</p>
              <p className="text-sm text-blue-700 mt-1">
                Complete our digital enrollment form — takes about 10 minutes.
              </p>
            </div>
            <Link
              href="/enroll"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 h-8"
            >
              Start Enrollment
            </Link>
          </CardContent>
        </Card>

        {/* Applications */}
        {family.applications.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications</h3>
            <div className="space-y-4">
              {family.applications.map((app) => (
                <Card key={app.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {app.child.firstName} {app.child.lastName}
                      </CardTitle>
                      <Badge className={statusColors[app.status]}>
                        {statusLabels[app.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Program: {app.child.programType.replace(/_/g, " ")}</p>
                      <p>Track: {app.track}</p>
                      <p>Submitted: {app.submittedAt
                        ? new Date(app.submittedAt).toLocaleDateString()
                        : "Not yet submitted"}</p>
                      {app.playdateScheduledAt && (
                        <p className="text-purple-700 font-medium">
                          Playdate: {new Date(app.playdateScheduledAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {family.applications.length === 0 && (
          <p className="text-gray-400 text-center py-12">
            No applications yet. Click &quot;Start Enrollment&quot; to begin.
          </p>
        )}
      </main>
    </div>
  );
}
