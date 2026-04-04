// src/app/careers/apply/page.tsx
import ApplicationForm from '@/components/careers/ApplicationForm'

export const metadata = {
  title: 'Apply | All Star Kids Academy Careers',
}

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const { role } = await searchParams
  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <div className="mb-10">
        <p className="text-blue-600 text-sm font-bold uppercase tracking-widest mb-2">Join Our Team</p>
        <h1 className="text-3xl font-black text-[#0a1628]">Submit Your Application</h1>
        <p className="text-slate-500 mt-2 text-sm">Fields marked * are required. This takes about 5 minutes.</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <ApplicationForm defaultRole={role} />
      </div>
    </div>
  )
}
