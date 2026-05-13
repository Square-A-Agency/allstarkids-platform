"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.primaryEmailAddress?.emailAddress || "",
    phone: "",
    address: "",
    city: "",
    state: "GA",
    zip: "",
    // Second parent (optional)
    parent2FirstName: "",
    parent2LastName: "",
    parent2Email: "",
    parent2Phone: "",
    parent2Employer: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/family/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create family profile");
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <a href="https://allstarkidsacademyga.com" className="inline-flex items-center justify-center bg-white rounded-2xl p-4 shadow-md border border-slate-100 mb-5">
            <img src="/logo.webp" alt="All Star Kids Academy" className="h-16 w-auto object-contain" />
          </a>
          <h1 className="text-3xl font-black text-slate-800">Set Up Your Family Profile</h1>
          <p className="text-slate-500 mt-2">This info pre-fills your enrollment form — takes 2 minutes.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Primary Parent */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-blue-900 px-6 py-4">
              <h2 className="text-base font-bold text-white">Primary Parent / Guardian</h2>
              <p className="text-xs text-blue-200 mt-0.5">Your contact information</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-semibold text-slate-700">First Name *</Label>
                  <Input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm font-semibold text-slate-700">Last Name *</Label>
                  <Input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} required className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email *</Label>
                <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">Phone Number *</Label>
                <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required placeholder="(404) 555-0100" className="mt-1" />
              </div>
              <div className="border-t border-slate-100 pt-4">
                <Label htmlFor="address" className="text-sm font-semibold text-slate-700">Street Address *</Label>
                <Input id="address" name="address" value={form.address} onChange={handleChange} required className="mt-1" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="city" className="text-sm font-semibold text-slate-700">City *</Label>
                  <Input id="city" name="city" value={form.city} onChange={handleChange} required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="state" className="text-sm font-semibold text-slate-700">State *</Label>
                  <Input id="state" name="state" value={form.state} onChange={handleChange} required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="zip" className="text-sm font-semibold text-slate-700">ZIP *</Label>
                  <Input id="zip" name="zip" value={form.zip} onChange={handleChange} required className="mt-1" />
                </div>
              </div>
            </div>
          </div>

          {/* Second Parent (optional) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-700 px-6 py-4">
              <h2 className="text-base font-bold text-white">Second Parent / Guardian</h2>
              <p className="text-xs text-slate-300 mt-0.5">Optional</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parent2FirstName" className="text-sm font-semibold text-slate-700">First Name</Label>
                  <Input id="parent2FirstName" name="parent2FirstName" value={form.parent2FirstName} onChange={handleChange} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="parent2LastName" className="text-sm font-semibold text-slate-700">Last Name</Label>
                  <Input id="parent2LastName" name="parent2LastName" value={form.parent2LastName} onChange={handleChange} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parent2Email" className="text-sm font-semibold text-slate-700">Email</Label>
                  <Input id="parent2Email" name="parent2Email" type="email" value={form.parent2Email} onChange={handleChange} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="parent2Phone" className="text-sm font-semibold text-slate-700">Phone</Label>
                  <Input id="parent2Phone" name="parent2Phone" type="tel" value={form.parent2Phone} onChange={handleChange} className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="parent2Employer" className="text-sm font-semibold text-slate-700">Employer</Label>
                <Input id="parent2Employer" name="parent2Employer" value={form.parent2Employer} onChange={handleChange} className="mt-1" />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all hover:scale-[1.02]"
            disabled={loading}
          >
            {loading ? "Saving..." : "Continue to Dashboard →"}
          </Button>
        </form>
      </div>
    </div>
  );
}
