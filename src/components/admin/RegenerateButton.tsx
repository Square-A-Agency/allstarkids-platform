'use client'

import { useState } from 'react'
import { readApiError } from '@/lib/api-response'

interface RegenerateButtonProps {
  applicationId: string
  documentType: string
}

export default function RegenerateButton({ applicationId, documentType }: RegenerateButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleRegenerate(confirm = false) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/regenerate-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType, confirm }),
      })
      const conflict = res.status === 409 ? await res.json().catch(() => ({})) : null
      if (conflict) {
        setLoading(false)
        if (conflict.requiresConfirm && !confirm) {
          if (window.confirm(conflict.error)) await handleRegenerate(true)
        } else {
          alert(`Regeneration failed: ${conflict.error ?? 'Conflict'}`)
        }
        return
      }
      const error = await readApiError(res)
      if (error) {
        alert(`Regeneration failed: ${error}`)
        setLoading(false)
        return
      }
      setLoading(false)
      window.location.reload()
    } catch (err) {
      alert(`Regeneration failed: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={() => handleRegenerate()}
      disabled={loading}
      className="text-xs px-2.5 py-1.5 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
    >
      {loading ? 'Regenerating…' : 'Regenerate'}
    </button>
  )
}
