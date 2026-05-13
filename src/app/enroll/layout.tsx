export default function EnrollLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="shrink-0 bg-white rounded-lg p-1 border border-slate-100 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.webp" alt="All Star Kids Academy" width={52} height={38} className="object-contain block" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900 leading-tight">All Star Kids Academy</p>
              <p className="text-xs text-slate-400">Enrollment Application</p>
            </div>
          </div>
          <a
            href="/dashboard"
            className="text-sm font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 transition-colors"
          >
            ← Dashboard
          </a>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
