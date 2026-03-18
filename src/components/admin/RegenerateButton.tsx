'use client'

import { useState } from 'react'

interface RegenerateButtonProps {
  applicationId: string
  documentType: string
}

export default function RegenerateButton({ applicationId, documentType }: RegenerateButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleRegenerate() {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/applications/${applicationId}/regenerate-document`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentType }),
        }
      )
      const json = await res.json()
      if (!res.ok || json.error) {
        alert(`Regeneration failed: ${json.error ?? 'Unknown error'}`)
        setLoading(false)
        return
      }
      window.location.reload()
    } catch (err) {
      alert(`Regeneration failed: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRegenerate}
      disabled={loading}
      className="text-xs px-2.5 py-1.5 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
    >
      {loading ? 'Regenerating…' : 'Regenerate'}
    </button>
  )
}
