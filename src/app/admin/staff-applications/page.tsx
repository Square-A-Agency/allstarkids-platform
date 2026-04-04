// src/app/admin/staff-applications/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isAdminUser } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { STAFF_ROLES } from '@/lib/careers'

const STATUS_COLORS: Record<string, string> = {
  PENDING:              'bg-yellow-100 text-yellow-800',
  UNDER_REVIEW:         'bg-blue-100 text-blue-800',
  INTERVIEW_SCHEDULED:  'bg-purple-100 text-purple-800',
  HIRED:                'bg-green-100 text-green-800',
  REJECTED:             'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:              'Pending',
  UNDER_REVIEW:         'Under Review',
  INTERVIEW_SCHEDULED:  'Interview Scheduled',
  HIRED:                'Hired',
  REJECTED:             'Rejected',
}

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Interview Scheduled', value: 'INTERVIEW_SCHEDULED' },
  { label: 'Hired', value: 'HIRED' },
  { label: 'Rejected', value: 'REJECTED' },
]

export default async function StaffApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; role?: string }>
}) {
  const { userId } = await auth()
  if (!isAdminUser(userId)) redirect('/')

  const { status: statusFilter, role: roleFilter } = await searchParams

  const where = {
    ...(statusFilter ? { status: statusFilter as any } : {}),
    ...(roleFilter ? { role: roleFilter } : {}),
  }

  const [applications, total, pending, interviewScheduled, hired] = await Promise.all([
    prisma.staffApplication.findMany({ where, orderBy: { createdAt: 'desc' } }),
    prisma.staffApplication.count(),
    prisma.staffApplication.count({ where: { status: 'PENDING' } }),
    prisma.staffApplication.count({ where: { status: 'INTERVIEW_SCHEDULED' } }),
    prisma.staffApplication.count({ where: { status: 'HIRED' } }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Staff Applications</h2>
        <p className="text-gray-500 mt-1">Review and manage job applications.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: total, color: 'text-gray-900' },
          { label: 'Pending', value: pending, color: 'text-yellow-600' },
          { label: 'Interview Scheduled', value: interviewScheduled, color: 'text-purple-600' },
          { label: 'Hired', value: hired, color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-lg border p-4">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {STATUS_FILTERS.map((f) => {
          const isActive = (statusFilter ?? '') === f.value
          const href = new URLSearchParams({
            ...(f.value ? { status: f.value } : {}),
            ...(roleFilter ? { role: roleFilter } : {}),
          }).toString()
          return (
            <Link
              key={f.value}
              href={href ? `/admin/staff-applications?${href}` : '/admin/staff-applications'}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-900 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
        <form method="GET" action="/admin/staff-applications" className="ml-auto flex items-center gap-2">
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <select
            name="role"
            defaultValue={roleFilter ?? ''}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="">All Roles</option>
            {STAFF_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button type="submit" className="text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Filter
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="hidden md:block bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Experience</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Applied</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {applications.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No applications found.</td>
              </tr>
            )}
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{app.firstName} {app.lastName}</td>
                <td className="px-4 py-3 text-gray-600">{app.role}</td>
                <td className="px-4 py-3 text-gray-600">{app.yearsExp} yr{app.yearsExp !== 1 ? 's' : ''}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(app.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status] ?? 'bg-gray-100 text-gray-800'}`}>
                    {STATUS_LABELS[app.status] ?? app.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/staff-applications/${app.id}`} className="text-blue-600 hover:text-blue-800 font-medium">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {applications.length === 0 && <p className="text-center text-gray-400 py-8">No applications found.</p>}
        {applications.map((app) => (
          <div key={app.id} className="bg-white rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">{app.firstName} {app.lastName}</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status] ?? 'bg-gray-100 text-gray-800'}`}>
                {STATUS_LABELS[app.status] ?? app.status}
              </span>
            </div>
            <p className="text-sm text-gray-600">{app.role} · {app.yearsExp} yr{app.yearsExp !== 1 ? 's' : ''} exp</p>
            <p className="text-sm text-gray-500">Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
            <Link href={`/admin/staff-applications/${app.id}`} className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium">View Application →</Link>
          </div>
        ))}
      </div>
    </div>
  )
}
