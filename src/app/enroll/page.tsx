"use client";

import { useState, useEffect } from "react";
import Step1FamilyInfo from "@/components/enrollment/Step1FamilyInfo";
import Step2Children from "@/components/enrollment/Step2Children";

export type FamilyInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  parent2FirstName: string;
  parent2LastName: string;
  parent2Email: string;
  parent2Phone: string;
  parent2WorkPhone: string;
  parent2Employer: string;
  parent2EmployerAddress: string;
};

export type ChildEntry = {
  tempId: string; // client-side only, for list management
  firstName: string;
  lastName: string;
  middleName: string;
  nameSuffix: string;
  dateOfBirth: string; // ISO date string
  sex: string;
  programType: string;
  track: string; // "PRE_K" | "UNIVERSAL"
};

export type EnrollmentWizardState = {
  step: number;
  familyInfo: FamilyInfo;
  children: ChildEntry[];
};

const initialFamilyInfo: FamilyInfo = {
  firstName: "", lastName: "", email: "", phone: "",
  address: "", city: "", state: "GA", zip: "",
  parent2FirstName: "", parent2LastName: "", parent2Email: "",
  parent2Phone: "", parent2WorkPhone: "", parent2Employer: "",
  parent2EmployerAddress: "",
};

export default function EnrollPage() {
  const [state, setState] = useState<EnrollmentWizardState>({
    step: 1,
    familyInfo: initialFamilyInfo,
    children: [],
  });
  const [loading, setLoading] = useState(true);

  // Pre-populate family info from their profile
  useEffect(() => {
    fetch("/api/family/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.family) {
          const f = data.family;
          setState((prev) => ({
            ...prev,
            familyInfo: {
              firstName: f.firstName || "",
              lastName: f.lastName || "",
              email: f.email || "",
              phone: f.phone || "",
              address: f.address || "",
              city: f.city || "",
              state: f.state || "GA",
              zip: f.zip || "",
              parent2FirstName: f.parent2FirstName || "",
              parent2LastName: f.parent2LastName || "",
              parent2Email: f.parent2Email || "",
              parent2Phone: f.parent2Phone || "",
              parent2WorkPhone: f.parent2WorkPhone || "",
              parent2Employer: f.parent2Employer || "",
              parent2EmployerAddress: f.parent2EmployerAddress || "",
            },
          }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const goToStep = (step: number) => setState((prev) => ({ ...prev, step }));
  const updateFamilyInfo = (info: FamilyInfo) =>
    setState((prev) => ({ ...prev, familyInfo: info }));
  const updateChildren = (children: ChildEntry[]) =>
    setState((prev) => ({ ...prev, children }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm">
          {["Family Info", "Children", "Medical", "Agreements", "Sign & Submit"].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${state.step === i + 1
                  ? "bg-blue-600 text-white"
                  : state.step > i + 1
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-500"}`}>
                {state.step > i + 1 ? "✓" : i + 1}
              </div>
              <span className={state.step === i + 1 ? "font-medium text-blue-700" : "text-gray-400"}>
                {label}
              </span>
              {i < 4 && <span className="text-gray-300">›</span>}
            </div>
          ))}
        </div>
      </div>

      {state.step === 1 && (
        <Step1FamilyInfo
          familyInfo={state.familyInfo}
          onNext={(info) => {
            updateFamilyInfo(info);
            goToStep(2);
          }}
        />
      )}
      {state.step === 2 && (
        <Step2Children
          children={state.children}
          onBack={() => goToStep(1)}
          onNext={(children) => {
            updateChildren(children);
            goToStep(3);
          }}
        />
      )}
      {state.step >= 3 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">Steps 3–5 coming soon</p>
          <p className="text-sm mt-2">Medical info, agreements, and signature steps will appear here.</p>
          <button
            onClick={() => goToStep(2)}
            className="mt-4 text-blue-600 hover:underline text-sm"
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}
