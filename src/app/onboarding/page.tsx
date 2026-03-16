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
    <div className="min-h-screen bg-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Welcome to All Star Kids Academy</h1>
          <p className="text-gray-600 mt-2">Let&apos;s set up your family profile to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primary Parent */}
          <Card>
            <CardHeader>
              <CardTitle>Primary Parent / Guardian</CardTitle>
              <CardDescription>Your contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} required />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} required />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required placeholder="(404) 555-0100" />
              </div>
              <Separator />
              <div>
                <Label htmlFor="address">Street Address *</Label>
                <Input id="address" name="address" value={form.address} onChange={handleChange} required />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" name="city" value={form.city} onChange={handleChange} required />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input id="state" name="state" value={form.state} onChange={handleChange} required />
                </div>
                <div>
                  <Label htmlFor="zip">ZIP *</Label>
                  <Input id="zip" name="zip" value={form.zip} onChange={handleChange} required />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Second Parent (optional) */}
          <Card>
            <CardHeader>
              <CardTitle>Second Parent / Guardian <span className="text-sm font-normal text-gray-400">(optional)</span></CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parent2FirstName">First Name</Label>
                  <Input id="parent2FirstName" name="parent2FirstName" value={form.parent2FirstName} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="parent2LastName">Last Name</Label>
                  <Input id="parent2LastName" name="parent2LastName" value={form.parent2LastName} onChange={handleChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parent2Email">Email</Label>
                  <Input id="parent2Email" name="parent2Email" type="email" value={form.parent2Email} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="parent2Phone">Phone</Label>
                  <Input id="parent2Phone" name="parent2Phone" type="tel" value={form.parent2Phone} onChange={handleChange} />
                </div>
              </div>
              <div>
                <Label htmlFor="parent2Employer">Employer</Label>
                <Input id="parent2Employer" name="parent2Employer" value={form.parent2Employer} onChange={handleChange} />
              </div>
            </CardContent>
          </Card>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Saving..." : "Continue to Dashboard →"}
          </Button>
        </form>
      </div>
    </div>
  );
}
