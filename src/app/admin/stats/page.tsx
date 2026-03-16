import { prisma } from "@/lib/prisma";

const PROGRAM_LABELS: Record<string, string> = {
  INFANT_TODDLER: "Infant & Toddler",
  PRESCHOOL: "Preschool",
  PRE_K: "Pre-K Classroom",
  AFTER_SCHOOL: "After-School Care",
  SUMMER_CAMP_EAGLETS: "Summer Camp — Eaglets",
  SUMMER_CAMP_EAGLES: "Summer Camp — Eagles",
};

export default async function StatsPage() {
  const [total, pending, underReview, playdateScheduled, accepted, rejected, allApps] =
    await Promise.all([
      prisma.enrollmentApplication.count(),
      prisma.enrollmentApplication.count({ where: { status: "PENDING" } }),
      prisma.enrollmentApplication.count({ where: { status: "UNDER_REVIEW" } }),
      prisma.enrollmentApplication.count({ where: { status: "PLAYDATE_SCHEDULED" } }),
      prisma.enrollmentApplication.count({ where: { status: "ACCEPTED" } }),
      prisma.enrollmentApplication.count({ where: { status: "REJECTED" } }),
      prisma.enrollmentApplication.findMany({
        include: { child: { select: { programType: true } } },
      }),
    ]);

  const programCounts = allApps.reduce<Record<string, number>>((acc, app) => {
    const key = app.child.programType;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const statusStats = [
    { label: "Total Applications", value: total, color: "text-gray-900", bg: "bg-white" },
    { label: "Pending Review", value: pending, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Under Review", value: underReview, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Playdate Scheduled", value: playdateScheduled, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Accepted", value: accepted, color: "text-green-600", bg: "bg-green-50" },
    { label: "Rejected", value: rejected, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Statistics</h2>
        <p className="text-gray-500 mt-1">Overview of enrollment application activity.</p>
      </div>

      {/* Status breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">By Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statusStats.map((stat) => (
            <div key={stat.label} className={`${stat.bg} border rounded-lg p-5`}>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Program breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">By Program</h3>
        {Object.keys(programCounts).length === 0 ? (
          <p className="text-gray-400 text-sm">No applications yet.</p>
        ) : (
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Program</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Applications</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(programCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([program, count]) => (
                    <tr key={program}>
                      <td className="px-4 py-3 text-gray-900">
                        {PROGRAM_LABELS[program] ?? program}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{count}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {total > 0 ? Math.round((count / total) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
