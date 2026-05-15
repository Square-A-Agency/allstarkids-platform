import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdminUser } from "@/lib/admin-auth";
import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!isAdminUser(userId)) redirect("/");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-950 to-blue-900 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <a href="https://allstarkidsacademyga.com" className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-1 shadow-sm">
              <Image src="/logo.webp" alt="All Star Kids Academy" width={48} height={35} className="object-contain" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">All Star Kids Academy</p>
              <p className="text-xs text-blue-300">Admin Dashboard</p>
            </div>
          </a>
          <nav className="flex items-center gap-1">
            <Link href="/admin" className="text-sm font-semibold text-blue-200 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
              Enrollment
            </Link>
            <Link href="/admin/staff-applications" className="text-sm font-semibold text-blue-200 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
              Staff Applications
            </Link>
            <Link href="/admin/job-openings" className="text-sm font-semibold text-blue-200 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
              Job Openings
            </Link>
            <Link href="/admin/stats" className="text-sm font-semibold text-blue-200 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
              Stats
            </Link>
            <Link href="/dashboard" className="text-sm font-semibold text-blue-200 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
              Family Portal
            </Link>
            <div className="ml-2">
              <UserButton />
            </div>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
