import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold text-blue-900">
          All Star Kids Academy
        </h1>
        <p className="text-xl text-gray-600">
          Enrollment Portal
        </p>
        <p className="text-gray-500">
          4518 Covington Hwy, Decatur, GA 30035 · (404) 284-2327
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 h-9"
          >
            Start Enrollment
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-all hover:bg-muted h-9"
          >
            Parent Login
          </Link>
        </div>
      </div>
    </main>
  );
}
