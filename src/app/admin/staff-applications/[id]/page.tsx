// src/app/admin/staff-applications/[id]/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { isAdminUser } from '@/lib/admin-auth'
import { requireOrg } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import StaffApplicationActions from '@/components/admin/StaffApplicationActions'
import { ExternalLink } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  PENDING:             'bg-yellow-100 text-yellow-800',
  UNDER_REVIEW:        'bg-blue-100 text-blue-800',
  INTERVIEW_SCHEDULED: 'bg-purple-100 text-purple-800',
  HIRED:               'bg-green-100 text-green-800',
  REJECTED:            'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:             'Pending',
  UNDER_REVIEW:        'Under Review',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  HIRED:               'Hired',
  REJECTED:            'Rejected',
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className="text-gray-900">{value ?? '—'}</p>
    </div>
  )
}

export default async function StaffApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId } = await auth()
  if (!(await isAdminUser(userId))) redirect('/')

  const { id } = await params
  const { orgId } = await requireOrg()
  const app = await prisma.staffApplication.findUnique({ where: { id, organizationId: orgId } })
  if (!app) notFound()

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/staff-applications" className="text-sm text-blue-600 hover:text-blue-800 mb-2 block">
            ← Staff Applications
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">{app.firstName} {app.lastName}</h2>
          <p className="text-gray-500 mt-1">{app.role}</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[app.status] ?? 'bg-gray-100 text-gray-800'}`}>
          {STATUS_LABELS[app.status] ?? app.status}
        </span>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="font-bold text-gray-900">Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email" value={<a href={`mailto:${app.email}`} className="text-blue-600 hover:underline">{app.email}</a>} />
          <Field label="Phone" value={<a href={`tel:${app.phone}`} className="text-blue-600 hover:underline">{app.phone}</a>} />
        </div>
      </div>

      {/* Experience */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="font-bold text-gray-900">Experience &amp; Availability</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Years of Experience" value={`${app.yearsExp} year${app.yearsExp !== 1 ? 's' : ''}`} />
          <Field label="Availability" value={app.availability} />
        </div>
      </div>

      {/* References */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="font-bold text-gray-900">References</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Reference 1" value={`${app.refOneName} — ${app.refOnePhone}`} />
          <Field label="Reference 2" value={`${app.refTwoName} — ${app.refTwoPhone}`} />
        </div>
      </div>

      {/* Cover Note */}
      <div className="bg-white rounded-lg border p-6 space-y-2">
        <h3 className="font-bold text-gray-900">Cover Note</h3>
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{app.coverNote}</p>
      </div>

      {/* Portfolio */}
      <div className="bg-white rounded-lg border p-6 space-y-3">
        <h3 className="font-bold text-gray-900">Portfolio / Resume</h3>
        <div className="flex flex-wrap items-center gap-4">
          {app.resumeUrl ? (
            <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm font-medium">
              <ExternalLink size={14} /> Download Resume
            </a>
          ) : (
            <span className="text-sm text-gray-400">No resume uploaded</span>
          )}
          {app.linkedinUrl && (
            <a href={app.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm font-medium">
              <ExternalLink size={14} /> LinkedIn Profile
            </a>
          )}
        </div>
      </div>

      {/* Status Actions */}
      <div className="bg-white rounded-lg border p-6">
        <StaffApplicationActions id={app.id} currentStatus={app.status} />
      </div>

      <p className="text-xs text-gray-400">Applied {new Date(app.createdAt).toLocaleString()}</p>
    </div>
  )
}
