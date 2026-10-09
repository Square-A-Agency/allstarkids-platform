import Link from "next/link";
import Image from "next/image";

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ signed?: string }> }) {
  const { signed } = await searchParams;
  const isSigned = signed === "1";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-yellow-400/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-green-400/10 blur-3xl pointer-events-none" />

      <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <a href="https://allstarkidsacademyga.com">
            <Image src="/logo.webp" alt="All Star Kids Academy" width={120} height={87} className="object-contain" />
          </a>
        </div>

        {/* Success icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-green-200">
          <span className="text-4xl">🎉</span>
        </div>

        <h1 className="text-2xl font-black text-slate-800 mb-2">
          {isSigned ? "All documents signed!" : "Application Submitted!"}
        </h1>
        <p className="text-slate-500 mb-2 leading-relaxed">
          {isSigned
            ? "Your enrollment packet is complete and signed copies are saved in your family portal. We will be in touch within 3 to 5 business days to schedule a playdate visit."
            : "Thank you! We have received your enrollment application and will be in touch within 3 to 5 business days to schedule a playdate visit."}
        </p>
        <p className="text-sm text-slate-400 mb-8">
          {isSigned ? "A confirmation email is on its way." : "A confirmation email has been sent to your inbox."}
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition-all hover:scale-105 shadow-lg shadow-blue-200"
        >
          View My Applications →
        </Link>

        <p className="text-xs text-slate-400 mt-6">
          Questions? Call us at (404) 284-2327
        </p>
      </div>
    </div>
  );
}
