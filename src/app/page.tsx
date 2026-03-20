import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#050d1f]">

      {/* ── Animated gradient background ── */}
      <div className="absolute inset-0 animate-gradient-pan bg-gradient-to-br from-[#0a1628] via-[#0d2147] to-[#071020]" />

      {/* ── Orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[100px] animate-float-slow" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-500/15 blur-[100px] animate-float-slow delay-400" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-blue-900/20 blur-[120px]" />
      </div>

      {/* ── Floating stars / sparkles ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {[
          { top: "12%", left: "8%",  size: "w-2 h-2",   delay: "delay-100" },
          { top: "22%", left: "85%", size: "w-3 h-3",   delay: "delay-300" },
          { top: "55%", left: "5%",  size: "w-1.5 h-1.5", delay: "delay-500" },
          { top: "70%", left: "90%", size: "w-2 h-2",   delay: "delay-200" },
          { top: "38%", left: "92%", size: "w-1.5 h-1.5", delay: "delay-700" },
          { top: "82%", left: "15%", size: "w-2.5 h-2.5", delay: "delay-400" },
          { top: "15%", left: "50%", size: "w-1.5 h-1.5", delay: "delay-600" },
          { top: "90%", left: "70%", size: "w-2 h-2",   delay: "delay-300" },
          { top: "45%", left: "75%", size: "w-1 h-1",   delay: "delay-800" },
          { top: "30%", left: "25%", size: "w-1.5 h-1.5", delay: "delay-200" },
        ].map((s, i) => (
          <div
            key={i}
            className={`absolute ${s.size} ${s.delay} animate-twinkle`}
            style={{ top: s.top, left: s.left }}
          >
            <div className="w-full h-full rounded-full bg-yellow-300/80 shadow-[0_0_6px_2px_rgba(253,224,71,0.5)]" />
          </div>
        ))}

        {/* Large decorative star */}
        <div className="absolute top-[8%] right-[12%] text-yellow-400/30 text-7xl animate-spin-slow select-none">★</div>
        <div className="absolute bottom-[10%] left-[8%]  text-blue-400/20  text-5xl animate-spin-slow select-none" style={{ animationDirection: "reverse" }}>✦</div>
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-16">

        {/* Logo card — bouncy scale-in */}
        <div className="mb-8 animate-scale-in">
          <div className="relative bg-white rounded-3xl p-5 shadow-[0_0_60px_-10px_rgba(59,130,246,0.5)] hover:shadow-[0_0_80px_-10px_rgba(59,130,246,0.7)] transition-shadow duration-500 animate-pulse-glow">
            <Image
              src="/logo.webp"
              alt="All Star Kids Academy"
              width={210}
              height={152}
              className="object-contain w-[210px] h-auto"
              priority
            />
          </div>
        </div>

        {/* Headline — staggered fade up */}
        <div className="text-center mb-10 space-y-4">
          <div className="animate-fade-in-up delay-100">
            <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-blue-400 bg-blue-400/10 border border-blue-400/20 px-4 py-1.5 rounded-full mb-4">
              Family Enrollment Portal
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.05] animate-fade-in-up delay-200">
            Where Every Child
            <span className="block gradient-text">Becomes a Star</span>
          </h1>
          <p className="text-blue-200/80 text-lg max-w-sm mx-auto leading-relaxed animate-fade-in-up delay-300">
            Enroll your child at Decatur&apos;s premier early learning academy — digitally, in minutes.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm animate-fade-in-up delay-400">
          <Link
            href="/sign-up"
            className="btn-shimmer flex-1 flex items-center justify-center gap-2 text-blue-950 font-black text-base px-6 py-4 rounded-2xl shadow-lg shadow-yellow-500/30 transition-all duration-200 hover:scale-105 hover:shadow-yellow-400/50 active:scale-100"
          >
            Start Enrollment →
          </Link>
          <Link
            href="/sign-in"
            className="glass flex-1 flex items-center justify-center gap-2 text-white font-bold text-base px-6 py-4 rounded-2xl transition-all duration-200 hover:scale-105 hover:bg-white/15 active:scale-100"
          >
            Parent Login
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-fade-in-up delay-500">
          {["🏫 Licensed & Accredited", "⭐ Georgia Pre-K Provider", "🔒 Secure Enrollment"].map((badge) => (
            <span key={badge} className="glass text-blue-200 text-xs font-semibold px-3 py-1.5 rounded-full">
              {badge}
            </span>
          ))}
        </div>

        {/* Info strip */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 text-blue-400/60 text-sm animate-fade-in delay-600">
          <span className="flex items-center gap-1.5 hover:text-blue-300 transition-colors">
            📍 4518 Covington Hwy, Decatur, GA 30035
          </span>
          <span className="hidden sm:block opacity-40">·</span>
          <span className="flex items-center gap-1.5 hover:text-blue-300 transition-colors">
            📞 (404) 284-2327
          </span>
        </div>
      </div>
    </main>
  );
}
