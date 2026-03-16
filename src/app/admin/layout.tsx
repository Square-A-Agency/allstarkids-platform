import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdminUser } from "@/lib/admin-auth";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!isAdminUser(userId)) redirect("/");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">All Star Kids Academy</h1>
          <p className="text-xs text-blue-200">Admin Dashboard</p>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/admin" className="text-blue-200 hover:text-white">Applications</Link>
          <Link href="/admin/stats" className="text-blue-200 hover:text-white">Stats</Link>
          <Link href="/" className="text-blue-200 hover:text-white">← Family Portal</Link>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
