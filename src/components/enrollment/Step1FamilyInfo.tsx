"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { FamilyInfo } from "@/types/enrollment";

interface Props {
  familyInfo: FamilyInfo;
  onNext: (info: FamilyInfo) => void;
}

export default function Step1FamilyInfo({ familyInfo, onNext }: Props) {
  const [form, setForm] = useState<FamilyInfo>(familyInfo);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Step 1: Family Information</h2>
        <p className="text-gray-500 mt-1">Please confirm your contact information. This applies to all children in this application.</p>
      </div>

      {/* Primary Parent */}
      <Card>
        <CardHeader>
          <CardTitle>Primary Parent / Guardian</CardTitle>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required />
            </div>
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

      {/* Second Parent */}
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
              <Label htmlFor="parent2Phone">Home Phone</Label>
              <Input id="parent2Phone" name="parent2Phone" type="tel" value={form.parent2Phone} onChange={handleChange} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="parent2WorkPhone">Work Phone</Label>
              <Input id="parent2WorkPhone" name="parent2WorkPhone" type="tel" value={form.parent2WorkPhone} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="parent2Employer">Employer</Label>
              <Input id="parent2Employer" name="parent2Employer" value={form.parent2Employer} onChange={handleChange} />
            </div>
          </div>
          <div>
            <Label htmlFor="parent2EmployerAddress">Employer Address</Label>
            <Input id="parent2EmployerAddress" name="parent2EmployerAddress" value={form.parent2EmployerAddress} onChange={handleChange} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg">
          Continue: Add Children →
        </Button>
      </div>
    </form>
  );
}
