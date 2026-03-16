export default function EnrollLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-blue-900">All Star Kids Academy</h1>
            <p className="text-sm text-gray-500">Enrollment Application</p>
          </div>
          <a href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Back to Dashboard
          </a>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
