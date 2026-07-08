import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isAdminUser } from '@/lib/admin-auth'
import { requireOrg } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { createJobOpening, deleteJobOpening } from './actions'

const ICON_OPTIONS = [
  { value: 'Baby',             label: 'Baby' },
  { value: 'Heart',            label: 'Heart' },
  { value: 'Users',            label: 'People' },
  { value: 'BookOpen',         label: 'Book' },
  { value: 'UtensilsCrossed',  label: 'Cook' },
  { value: 'Bus',              label: 'Bus' },
  { value: 'Star',             label: 'Star' },
  { value: 'Shield',           label: 'Shield' },
]

const COLOR_OPTIONS = [
  { value: '#ec4899', label: 'Pink' },
  { value: '#f43f5e', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#10b981', label: 'Green' },
  { value: '#0ea5e9', label: 'Sky' },
  { value: '#6366f1', label: 'Indigo' },
  { value: '#8b5cf6', label: 'Purple' },
]

export default async function JobOpeningsPage() {
  const { userId } = await auth()
  if (!(await isAdminUser(userId))) redirect('/')

  const { orgId } = await requireOrg()
  const openings = await prisma.jobOpening.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'asc' } })

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Job Openings</h2>
        <p className="text-gray-500 mt-1">Manage the positions shown on the public careers page.</p>
      </div>

      {/* Current openings */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {openings.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-10">No openings yet. Add one below.</p>
        )}
        {openings.map((opening) => (
          <div key={opening.id} className="flex items-start justify-between gap-4 px-5 py-4 border-b last:border-b-0">
            <div className="flex items-start gap-3">
              <div
                className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                style={{ background: opening.accentColor }}
              />
              <div>
                <p className="font-semibold text-gray-900">{opening.title}</p>
                <p className="text-sm text-gray-500 mt-0.5 leading-snug">{opening.description}</p>
              </div>
            </div>
            <form action={async () => { 'use server'; await deleteJobOpening(opening.id) }}>
              <button
                type="submit"
                className="shrink-0 text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
              >
                Remove
              </button>
            </form>
          </div>
        ))}
      </div>

      {/* Create form */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-bold text-gray-900 mb-5">Add New Opening</h3>
        <form action={createJobOpening} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700" htmlFor="title">Position Title *</label>
            <input
              id="title"
              name="title"
              required
              placeholder="e.g. Teacher (Pre-K)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700" htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              required
              rows={3}
              placeholder="Brief description of the role..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700" htmlFor="icon">Icon</label>
              <select
                id="icon"
                name="icon"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ICON_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700" htmlFor="accentColor">Color</label>
              <select
                id="accentColor"
                name="accentColor"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {COLOR_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-900 text-white font-semibold text-sm px-5 py-2 rounded-lg hover:brightness-110 transition-[filter]"
          >
            Add Opening
          </button>
        </form>
      </div>
    </div>
  )
}
