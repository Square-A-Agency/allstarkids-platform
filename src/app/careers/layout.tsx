// src/app/careers/layout.tsx
import Image from 'next/image'
import Link from 'next/link'

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/careers" className="flex items-center gap-3">
            <Image src="/logo.webp" alt="All Star Kids Academy" width={44} height={32} className="object-contain" />
            <div>
              <p className="text-sm font-extrabold text-[#0a1628] leading-tight">All Star Kids Academy</p>
              <p className="text-xs text-slate-400 font-medium">Careers</p>
            </div>
          </Link>
          <Link
            href="/careers/apply"
            className="bg-[#fbbf24] text-[#0a1628] font-black text-sm px-5 py-2 rounded-md hover:brightness-110 transition-[filter]"
          >
            Apply Now →
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 mt-12">
        © {new Date().getFullYear()} All Star Kids Academy · 4518 Covington Hwy, Decatur, GA 30035
      </footer>
    </div>
  )
}
