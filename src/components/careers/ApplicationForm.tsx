'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { STAFF_ROLES } from '@/lib/careers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function ApplicationForm({ defaultRole }: { defaultRole?: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/careers/apply', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }
      router.push('/careers/apply/success')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Role */}
      <div className="space-y-2">
        <Label htmlFor="role">Position *</Label>
        <select
          id="role"
          name="role"
          required
          defaultValue={defaultRole ?? ''}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="" disabled>Select a position</option>
          {STAFF_ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Personal info */}
      <div>
        <h3 className="font-extrabold text-[#0a1628] mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input id="firstName" name="firstName" required placeholder="Jane" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input id="lastName" name="lastName" required placeholder="Smith" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" name="email" type="email" required placeholder="jane@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input id="phone" name="phone" type="tel" required placeholder="404-555-0100" />
          </div>
        </div>
      </div>

      {/* Experience & Availability */}
      <div>
        <h3 className="font-extrabold text-[#0a1628] mb-4">Experience &amp; Availability</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="yearsExp">Years of Experience *</Label>
            <Input id="yearsExp" name="yearsExp" type="number" min="0" required placeholder="3" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="availability">Availability *</Label>
            <Input id="availability" name="availability" required placeholder="Mon–Fri, 6:00 AM – 3:00 PM" />
          </div>
        </div>
      </div>

      {/* References */}
      <div>
        <h3 className="font-extrabold text-[#0a1628] mb-4">References</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="refOneName">Reference 1 — Name *</Label>
              <Input id="refOneName" name="refOneName" required placeholder="Alice Brown" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refOnePhone">Reference 1 — Phone *</Label>
              <Input id="refOnePhone" name="refOnePhone" type="tel" required placeholder="404-555-0101" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="refTwoName">Reference 2 — Name *</Label>
              <Input id="refTwoName" name="refTwoName" required placeholder="Bob Davis" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refTwoPhone">Reference 2 — Phone *</Label>
              <Input id="refTwoPhone" name="refTwoPhone" type="tel" required placeholder="404-555-0102" />
            </div>
          </div>
        </div>
      </div>

      {/* Cover Note */}
      <div className="space-y-2">
        <Label htmlFor="coverNote">Cover Note *</Label>
        <Textarea
          id="coverNote"
          name="coverNote"
          required
          rows={5}
          placeholder="Tell us why you'd be a great fit at All Star Kids Academy..."
        />
      </div>

      {/* Portfolio / Resume */}
      <div>
        <h3 className="font-extrabold text-[#0a1628] mb-4">Portfolio / Resume <span className="text-slate-400 font-normal text-sm">(optional)</span></h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input id="linkedinUrl" name="linkedinUrl" type="url" placeholder="https://linkedin.com/in/yourname" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resume">Resume Upload (PDF or Word)</Label>
            <Input id="resume" name="resume" type="file" accept=".pdf,.doc,.docx" />
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#0a1628] text-white font-black py-3 text-base rounded-md hover:brightness-110 transition-[filter]"
      >
        {loading ? 'Submitting…' : 'Submit Application →'}
      </Button>
    </form>
  )
}
