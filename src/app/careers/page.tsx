import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import * as LucideIcons from 'lucide-react'

export const metadata = {
  title: 'Careers | All Star Kids Academy',
  description: 'Join the All Star Kids Academy team in Decatur, GA. Open positions for teachers and staff.',
}

type LucideIconName = keyof typeof LucideIcons

function JobIcon({ name, color }: { name: string; color: string }) {
  const Icon = (LucideIcons[name as LucideIconName] ?? LucideIcons.Users) as React.ComponentType<{ size?: number; style?: React.CSSProperties; strokeWidth?: number }>
  return <Icon size={24} style={{ color }} strokeWidth={2} />
}

export default async function CareersPage() {
  const openings = await prisma.jobOpening.findMany({ orderBy: { createdAt: 'asc' } })

  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <div className="mb-12">
        <p className="text-blue-600 text-sm font-bold uppercase tracking-widest mb-2">Join Our Team</p>
        <h1 className="text-4xl font-black text-[#0a1628] mb-3">We&apos;re Hiring</h1>
        <p className="text-slate-500 max-w-xl">
          Help us give every child the start they deserve. We&apos;re looking for passionate, dedicated people in Decatur, GA.
        </p>
      </div>

      {openings.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-medium">No open positions right now.</p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-14">
          {openings.map((opening) => (
            <div
              key={opening.id}
              className="bg-white rounded-2xl shadow-sm border-t-4 p-8 flex flex-col gap-4"
              style={{ borderColor: opening.accentColor }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: `${opening.accentColor}18` }}
              >
                <JobIcon name={opening.icon} color={opening.accentColor} />
              </div>
              <p className="font-extrabold text-[#0a1628] text-lg leading-snug">{opening.title}</p>
              <p className="text-sm text-slate-600 leading-relaxed flex-1">{opening.description}</p>
              <Link
                href={`/careers/apply?role=${encodeURIComponent(opening.title)}`}
                className="inline-block text-center font-black text-sm px-6 py-3 rounded-md transition-[filter] hover:brightness-110 text-white"
                style={{ background: opening.accentColor }}
              >
                Apply Now
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="bg-[#0a1628] rounded-2xl p-10 text-center text-white">
        <h2 className="text-2xl font-black mb-2">Why work at All Star Kids?</h2>
        <p className="text-blue-200 max-w-lg mx-auto">
          We&apos;re more than a daycare — we&apos;re a community. Our staff are valued, supported, and part of something that truly matters.
        </p>
      </div>
    </div>
  )
}
