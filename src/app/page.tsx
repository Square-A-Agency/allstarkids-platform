import Link from "next/link";
import { Button } from "@/components/ui/button";

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
          <Button asChild size="lg">
            <Link href="/sign-up">Start Enrollment</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/sign-in">Parent Login</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
