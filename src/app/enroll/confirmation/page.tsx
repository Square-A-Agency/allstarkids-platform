import Link from "next/link";

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
        <p className="text-gray-600 mb-6">
          Thank you! We&apos;ve received your enrollment application and will be in touch within
          3–5 business days to schedule a playdate.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          A confirmation email has been sent to your inbox.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          View My Applications
        </Link>
      </div>
    </div>
  );
}
