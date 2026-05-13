import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";

const statusConfig: Record<string, { label: string; dot: string; badge: string }> = {
  PENDING:            { label: "Pending Review",      dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-700 border-amber-200" },
  UNDER_REVIEW:       { label: "Under Review",        dot: "bg-blue-400",    badge: "bg-blue-50 text-blue-700 border-blue-200" },
  PLAYDATE_SCHEDULED: { label: "Playdate Scheduled",  dot: "bg-purple-400",  badge: "bg-purple-50 text-purple-700 border-purple-200" },
  ACCEPTED:           { label: "Accepted! 🎉",         dot: "bg-green-400",   badge: "bg-green-50 text-green-700 border-green-200" },
  REJECTED:           { label: "Not Accepted",        dot: "bg-red-400",     badge: "bg-red-50 text-red-700 border-red-200" },
};

const programLabels: Record<string, string> = {
  INFANT:               "Infant (8 weeks–12 months)",
  TODDLER:              "Toddler (12–24 months)",
  PRESCHOOL:            "Preschool (Ages 3–4)",
  PRE_K:                "Georgia Pre-K (Ages 4–5)",
  AFTER_SCHOOL:         "After School (Ages 5–12)",
  SUMMER_CAMP_EAGLETS:  "Summer Camp Eaglets (Ages 5–7)",
  SUMMER_CAMP_EAGLES:   "Summer Camp Eagles (Ages 8–12)",
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

  const accepted = family.applications.filter((a) => a.status === "ACCEPTED").length;
  const pending  = family.applications.filter((a) => a.status === "PENDING" || a.status === "UNDER_REVIEW").length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <a href="https://allstarkidsacademyga.com" className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-1 border border-slate-100 shadow-sm">
              <Image src="/logo.webp" alt="All Star Kids Academy" width={52} height={38} className="object-contain" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-blue-900 leading-tight">All Star Kids Academy</p>
              <p className="text-xs text-slate-400">Family Portal</p>
            </div>
          </a>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600 hidden sm:block">
              {family.firstName} {family.lastName}
            </span>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Welcome banner */}
        <div className="animate-gradient-pan bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-7 text-white relative overflow-hidden shadow-xl shadow-blue-900/30 animate-fade-in-up">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="absolute right-12 bottom-0 w-40 h-40 bg-yellow-400/10 rounded-full translate-y-1/2 animate-float-slow" />
          <div className="absolute left-0 bottom-0 w-32 h-32 bg-blue-400/10 rounded-full -translate-x-1/2 translate-y-1/4" />
          <div className="relative">
            <p className="text-blue-300 text-sm font-semibold mb-1 tracking-wide">Welcome back,</p>
            <h1 className="text-4xl font-black mb-2 leading-tight">{family.firstName}! 👋</h1>
            <p className="text-blue-200 text-sm max-w-xs">
              {family.applications.length === 0
                ? "Start your child's enrollment journey today."
                : `You have ${family.applications.length} application${family.applications.length !== 1 ? "s" : ""} on file.`}
            </p>
          </div>
        </div>

        {/* Stats row */}
        {family.applications.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: family.applications.length, label: "Total", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", delay: "delay-100" },
              { value: pending,  label: "In Review", color: "text-amber-500", bg: "bg-amber-50",  border: "border-amber-100", delay: "delay-200" },
              { value: accepted, label: "Accepted",  color: "text-green-500", bg: "bg-green-50",  border: "border-green-100", delay: "delay-300" },
            ].map((stat) => (
              <div key={stat.label} className={`${stat.bg} rounded-2xl border ${stat.border} p-5 text-center shadow-sm animate-count-up ${stat.delay} hover:scale-105 transition-transform duration-200 cursor-default`}>
                <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Enroll CTA */}
        <div className="animate-fade-in-up delay-200 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Enroll a Child</h2>
            <p className="text-sm text-slate-500 mt-0.5">Our digital form takes about 10 minutes to complete.</p>
          </div>
          <Link
            href="/enroll"
            className="flex-shrink-0 flex items-center gap-2 btn-shimmer text-blue-950 font-black text-sm px-6 py-3 rounded-xl transition-all hover:scale-105 shadow-md shadow-yellow-200 active:scale-100"
          >
            Start Enrollment →
          </Link>
        </div>

        {/* Applications list */}
        {family.applications.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4 animate-fade-in-up delay-300">Applications</h2>
            <div className="space-y-3">
              {family.applications.map((app, idx) => {
                const cfg = statusConfig[app.status] ?? statusConfig.PENDING;
                return (
                  <div
                    key={app.id}
                    className={`bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5 animate-fade-in-up`}
                    style={{ animationDelay: `${300 + idx * 80}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-xl font-black text-blue-700 border border-blue-100">
                          {app.child.firstName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{app.child.firstName} {app.child.lastName}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {programLabels[app.child.programType] ?? app.child.programType.replace(/_/g, " ")}
                          </p>
                        </div>
                      </div>
                      <span className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                      <span>Submitted: <span className="font-semibold text-slate-700">
                        {app.submittedAt
                          ? new Date(app.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "Not yet submitted"}
                      </span></span>
                      {app.playdateScheduledAt && (
                        <span className="text-purple-600 font-semibold">
                          🗓 Playdate: {new Date(app.playdateScheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {family.applications.length === 0 && (
          <div className="animate-fade-in-up delay-300 bg-white rounded-2xl border-2 border-dashed border-slate-200 p-14 text-center hover:border-blue-200 transition-colors duration-300">
            <div className="text-5xl mb-4 animate-float">📋</div>
            <p className="font-bold text-slate-700 text-lg">No applications yet</p>
            <p className="text-sm text-slate-400 mt-1">Click &quot;Start Enrollment&quot; above to begin your child&apos;s journey.</p>
          </div>
        )}
      </main>
    </div>
  );
}
