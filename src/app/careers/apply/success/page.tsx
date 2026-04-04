// src/app/careers/apply/success/page.tsx
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export const metadata = {
  title: 'Application Submitted | All Star Kids Academy',
}

export default function SuccessPage() {
  return (
    <div className="max-w-xl mx-auto px-6 py-24 text-center">
      <CheckCircle size={56} className="text-green-500 mx-auto mb-6" />
      <h1 className="text-3xl font-black text-[#0a1628] mb-3">Application Received!</h1>
      <p className="text-slate-500 mb-8 leading-relaxed">
        Thank you for applying to All Star Kids Academy. We'll review your application and be in touch soon.
      </p>
      <Link
        href="/careers"
        className="inline-block bg-[#0a1628] text-white font-black text-sm px-8 py-3 rounded-md hover:brightness-110 transition-[filter]"
      >
        ← Back to Careers
      </Link>
    </div>
  )
}
