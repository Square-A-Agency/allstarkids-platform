// src/app/careers/page.tsx
import Link from 'next/link'
import { Baby, Heart, Users, BookOpen, UtensilsCrossed, Bus } from 'lucide-react'

export const metadata = {
  title: 'Careers | All Star Kids Academy',
  description: 'Join the All Star Kids Academy team in Decatur, GA. Open positions for teachers and staff.',
}

const roles = [
  {
    title: 'Teacher (Infants)',
    icon: Baby,
    accentColor: '#ec4899',
    description: 'Nurture and care for our youngest learners, creating a safe and stimulating environment for infants.',
  },
  {
    title: 'Teacher (1 Year Olds)',
    icon: Heart,
    accentColor: '#f43f5e',
    description: 'Provide our children with a solid learning foundation to be prepared for their exciting next step to the 2\'s.',
  },
  {
    title: 'Teacher (2 Year Olds)',
    icon: Users,
    accentColor: '#6366f1',
    description: 'Engage our children in productive ways to keep them prepared for their jump to the 3\'s.',
  },
  {
    title: 'Teacher (3-4 Year Olds)',
    icon: BookOpen,
    accentColor: '#0ea5e9',
    description: 'Guide our pre-K children through early literacy, numeracy, and social skills as they prepare for kindergarten.',
  },
  {
    title: 'Cook',
    icon: UtensilsCrossed,
    accentColor: '#10b981',
    description: 'Prepare healthy, nutritious meals for our children each day in a clean and well-organized kitchen.',
  },
  {
    title: 'Bus Driver',
    icon: Bus,
    accentColor: '#eab308',
    description: 'Guarantee our children run on an efficient time schedule to get to school on time.',
  },
]

export default function CareersPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <div className="mb-12">
        <p className="text-blue-600 text-sm font-bold uppercase tracking-widest mb-2">Join Our Team</p>
        <h1 className="text-4xl font-black text-[#0a1628] mb-3">We're Hiring</h1>
        <p className="text-slate-500 max-w-xl">
          Help us give every child the start they deserve. We're looking for passionate, dedicated people in Decatur, GA.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-14">
        {roles.map(({ title, icon: Icon, accentColor, description }) => (
          <div
            key={title}
            className="bg-white rounded-2xl shadow-sm border-t-4 p-8 flex flex-col gap-4"
            style={{ borderColor: accentColor }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `${accentColor}18` }}
            >
              <Icon size={24} style={{ color: accentColor }} strokeWidth={2} />
            </div>
            <p className="font-extrabold text-[#0a1628] text-lg leading-snug">{title}</p>
            <p className="text-sm text-slate-600 leading-relaxed flex-1">{description}</p>
            <Link
              href={`/careers/apply?role=${encodeURIComponent(title)}`}
              className="inline-block text-center font-black text-sm px-6 py-3 rounded-md transition-[filter] hover:brightness-110 text-white"
              style={{ background: accentColor }}
            >
              Apply Now
            </Link>
          </div>
        ))}
      </div>

      <div className="bg-[#0a1628] rounded-2xl p-10 text-center text-white">
        <h2 className="text-2xl font-black mb-2">Why work at All Star Kids?</h2>
        <p className="text-blue-200 max-w-lg mx-auto">
          We're more than a daycare — we're a community. Our staff are valued, supported, and part of something that truly matters.
        </p>
      </div>
    </div>
  )
}
