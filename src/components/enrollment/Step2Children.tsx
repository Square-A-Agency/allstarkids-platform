"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApplicationTrack, getProgramTypeFromAge, PROGRAM_LABELS } from "@/lib/enrollment-utils";
import type { ChildEntry } from "@/types/enrollment";

interface Props {
  children: ChildEntry[];
  onBack: () => void;
  onNext: (children: ChildEntry[]) => void;
}

const emptyChild = (): ChildEntry => ({
  tempId: Math.random().toString(36).slice(2),
  firstName: "",
  lastName: "",
  middleName: "",
  nameSuffix: "",
  dateOfBirth: "",
  sex: "",
  programType: "",
  track: "",
});

export default function Step2Children({ children: initialChildren, onBack, onNext }: Props) {
  const [children, setChildren] = useState<ChildEntry[]>(
    initialChildren.length > 0 ? initialChildren : [emptyChild()]
  );
  const [error, setError] = useState("");

  const updateChild = (tempId: string, field: keyof ChildEntry, value: string) => {
    setChildren((prev) =>
      prev.map((child) => {
        if (child.tempId !== tempId) return child;
        const updated = { ...child, [field]: value };
        // Auto-detect track and program when DOB changes
        if (field === "dateOfBirth" && value) {
          const dob = new Date(value);
          if (!isNaN(dob.getTime())) {
            updated.track = getApplicationTrack(dob);
            updated.programType = getProgramTypeFromAge(dob);
          }
        }
        return updated;
      })
    );
  };

  const addChild = () => {
    setChildren((prev) => [...prev, emptyChild()]);
  };

  const removeChild = (tempId: string) => {
    setChildren((prev) => prev.filter((c) => c.tempId !== tempId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    for (const child of children) {
      if (!child.firstName || !child.lastName || !child.dateOfBirth || !child.sex) {
        setError("Please fill in all required fields for each child.");
        return;
      }
    }
    if (children.length === 0) {
      setError("Please add at least one child.");
      return;
    }
    onNext(children);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Step 2: Children</h2>
        <p className="text-gray-500 mt-1">
          Add all children you are enrolling. We&apos;ll automatically detect the right program based on their date of birth.
        </p>
      </div>

      <div className="space-y-6">
        {children.map((child, index) => (
          <Card key={child.tempId} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Child {index + 1}
                  {child.firstName && ` — ${child.firstName}`}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {child.track && (
                    <Badge className={child.track === "PRE_K" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}>
                      {child.track === "PRE_K" ? "Georgia Pre-K" : "Standard Enrollment"}
                    </Badge>
                  )}
                  {children.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChild(child.tempId)}
                      className="text-red-400 hover:text-red-600 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name *</Label>
                  <Input
                    value={child.firstName}
                    onChange={(e) => updateChild(child.tempId, "firstName", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input
                    value={child.lastName}
                    onChange={(e) => updateChild(child.tempId, "lastName", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Middle Name</Label>
                  <Input
                    value={child.middleName}
                    onChange={(e) => updateChild(child.tempId, "middleName", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Suffix (Jr, Sr, II, III)</Label>
                  <Input
                    value={child.nameSuffix}
                    onChange={(e) => updateChild(child.tempId, "nameSuffix", e.target.value)}
                    placeholder="Leave blank if none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date of Birth *</Label>
                  <Input
                    type="date"
                    value={child.dateOfBirth}
                    onChange={(e) => updateChild(child.tempId, "dateOfBirth", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Sex *</Label>
                  <Select
                    value={child.sex}
                    onValueChange={(v) => v && updateChild(child.tempId, "sex", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Program — auto-detected but overrideable */}
              <div>
                <Label>Program *</Label>
                <Select
                  value={child.programType}
                  onValueChange={(v) => v && updateChild(child.tempId, "programType", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program (auto-detected from DOB)" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROGRAM_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {child.track === "PRE_K" && (
                  <p className="text-xs text-purple-600 mt-1">
                    ★ This child qualifies for Georgia&apos;s Pre-K Program. Additional state forms and document uploads will be required.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <button
        type="button"
        onClick={addChild}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors text-sm font-medium"
      >
        + Add Another Child
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 text-sm font-medium"
        >
          ← Back
        </button>
        <Button type="submit" size="lg">
          Continue: Medical Info →
        </Button>
      </div>
    </form>
  );
}
