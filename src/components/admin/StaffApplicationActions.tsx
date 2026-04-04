// src/components/admin/StaffApplicationActions.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VALID_STAFF_STATUSES } from '@/lib/careers'
import { Button } from '@/components/ui/button'

const STATUS_LABELS: Record<string, string> = {
  PENDING:             'Pending',
  UNDER_REVIEW:        'Under Review',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  HIRED:               'Hired',
  REJECTED:            'Rejected',
}

export default function StaffApplicationActions({
  id,
  currentStatus,
}: {
  id: string
  currentStatus: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function updateStatus(status: string) {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/staff-applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      router.refresh()
    } catch {
      setError('Failed to update status. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-gray-700">Update Status</p>
      <div className="flex flex-wrap gap-2">
        {(VALID_STAFF_STATUSES as readonly string[])
          .filter((s) => s !== currentStatus)
          .map((s) => (
            <Button
              key={s}
              variant={s === 'REJECTED' ? 'destructive' : 'outline'}
              size="sm"
              disabled={loading}
              onClick={() => updateStatus(s)}
            >
              → {STATUS_LABELS[s] ?? s}
            </Button>
          ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
