import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdminUser } from "@/lib/admin-auth";
import { requireOrg } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  PLAYDATE_SCHEDULED: "bg-purple-100 text-purple-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  UNDER_REVIEW: "Under Review",
  PLAYDATE_SCHEDULED: "Playdate Scheduled",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

const PROGRAM_LABELS: Record<string, string> = {
  INFANT: "Infant (8 weeks–12 months)",
  TODDLER: "Toddler (12–24 months)",
  PRESCHOOL: "Preschool",
  PRE_K: "Pre-K Classroom",
  AFTER_SCHOOL: "After-School Care",
  SUMMER_CAMP_EAGLETS: "Summer Camp — Eaglets",
  SUMMER_CAMP_EAGLES: "Summer Camp — Eagles",
};

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Playdate Scheduled", value: "PLAYDATE_SCHEDULED" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Rejected", value: "REJECTED" },
];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { userId } = await auth();
  if (!(await isAdminUser(userId))) redirect("/");

  const { status: statusFilter } = await searchParams;

  const { orgId } = await requireOrg();
  const where = { organizationId: orgId, ...(statusFilter ? { status: statusFilter as any } : {}) };

  const [applications, total, pending, accepted] = await Promise.all([
    prisma.enrollmentApplication.findMany({
      where,
      include: { child: true, family: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.enrollmentApplication.count({ where: { organizationId: orgId } }),
    prisma.enrollmentApplication.count({ where: { organizationId: orgId, status: "PENDING" } }),
    prisma.enrollmentApplication.count({ where: { organizationId: orgId, status: "ACCEPTED" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Applications</h2>
        <p className="text-gray-500 mt-1">Review and manage enrollment applications.</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-sm text-gray-500">Total Applications</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-2xl font-bold text-yellow-600">{pending}</p>
          <p className="text-sm text-gray-500">Pending Review</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-2xl font-bold text-green-600">{accepted}</p>
          <p className="text-sm text-gray-500">Accepted</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const isActive = (statusFilter ?? "") === f.value;
          return (
            <Link
              key={f.value}
              href={f.value ? `/admin?status=${f.value}` : "/admin"}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-900 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Child Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Program</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Track</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Family</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Submitted</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {applications.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No applications found.
                </td>
              </tr>
            )}
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {app.child.firstName} {app.child.lastName}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {PROGRAM_LABELS[app.child.programType] ?? app.child.programType}
                </td>
                <td className="px-4 py-3 text-gray-600">{app.track}</td>
                <td className="px-4 py-3 text-gray-600">
                  {app.family.firstName} {app.family.lastName}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {app.submittedAt
                    ? new Date(app.submittedAt).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusColors[app.status] ?? "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {statusLabels[app.status] ?? app.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/applications/${app.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {applications.length === 0 && (
          <p className="text-center text-gray-400 py-8">No applications found.</p>
        )}
        {applications.map((app) => (
          <div key={app.id} className="bg-white rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">
                {app.child.firstName} {app.child.lastName}
              </p>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  statusColors[app.status] ?? "bg-gray-100 text-gray-800"
                }`}
              >
                {statusLabels[app.status] ?? app.status}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {PROGRAM_LABELS[app.child.programType] ?? app.child.programType} · {app.track}
            </p>
            <p className="text-sm text-gray-500">
              Family: {app.family.firstName} {app.family.lastName}
            </p>
            <p className="text-sm text-gray-500">
              Submitted:{" "}
              {app.submittedAt
                ? new Date(app.submittedAt).toLocaleDateString()
                : "—"}
            </p>
            <Link
              href={`/admin/applications/${app.id}`}
              className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View Application →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
