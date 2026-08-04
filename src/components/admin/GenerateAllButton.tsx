'use client'

import { useState } from 'react'
import { readApiError } from '@/lib/api-response'

export default function GenerateAllButton({ applicationId }: { applicationId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/generate-documents`, {
        method: 'POST',
      })
      const error = await readApiError(res)
      if (error) {
        alert(`Generation failed: ${error}`)
        setLoading(false)
        return
      }
      window.location.reload()
    } catch (err) {
      alert(`Generation failed: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
    >
      {loading ? 'Generating…' : 'Generate All Documents'}
    </button>
  )
}
