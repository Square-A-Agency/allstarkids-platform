import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "All Star Kids Academy — Enrollment Portal",
  description: "Enroll your child at All Star Kids Academy in Decatur, GA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${nunito.variable} ${nunito.className} antialiased`}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
