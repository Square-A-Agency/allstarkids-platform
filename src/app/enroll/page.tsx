"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Step1FamilyInfo from "@/components/enrollment/Step1FamilyInfo";
import Step2Children from "@/components/enrollment/Step2Children";
import Step3Medical from "@/components/enrollment/Step3Medical";
import Step4PreK from "@/components/enrollment/Step4PreK";
import Step4Agreements from "@/components/enrollment/Step4Agreements";
import Step5SignSubmit from "@/components/enrollment/Step5SignSubmit";

export type { FamilyInfo, ChildEntry, EnrollmentWizardState, EmergencyContact, AuthorizedPickup, InfantFeedingPlan, TopicalPreparations } from "@/types/enrollment";
import type { FamilyInfo, ChildEntry, EnrollmentWizardState } from "@/types/enrollment";

const initialFamilyInfo: FamilyInfo = {
  firstName: "", lastName: "", email: "", phone: "",
  address: "", city: "", state: "GA", zip: "",
  parent2FirstName: "", parent2LastName: "", parent2Email: "",
  parent2Phone: "", parent2WorkPhone: "", parent2Employer: "",
  parent2EmployerAddress: "",
};

export default function EnrollPage() {
  const router = useRouter();
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

  const hasPreKChild = state.children.some((c) => c.track === "PRE_K");

  // Step labels depend on whether there are Pre-K children
  const stepLabels = hasPreKChild
    ? ["Family Info", "Children", "Medical", "Pre-K Forms", "Agreements", "Sign & Submit"]
    : ["Family Info", "Children", "Medical", "Agreements", "Sign & Submit"];

  // Map internal step number (1–6) to display step index (0-based) for the indicator
  // Internal: 1=Family, 2=Children, 3=Medical, 4=PreK(if prek)/Agreements(if not), 5=Agreements(if prek)/SignSubmit(if not), 6=SignSubmit(if prek)
  function getDisplayStep(): number {
    if (hasPreKChild) {
      // 6 steps: 1→1, 2→2, 3→3, 4→4, 5→5, 6→6
      return state.step;
    } else {
      // 5 steps, but internal steps skip 4 (Pre-K)
      // Internal 1→display 1, 2→2, 3→3, 5→4, 6→5
      if (state.step <= 3) return state.step;
      if (state.step === 5) return 4;
      if (state.step === 6) return 5;
      return state.step;
    }
  }

  const displayStep = getDisplayStep();

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
        <div className="flex items-center gap-2 text-sm flex-wrap">
          {stepLabels.map((label, i) => {
            const stepNum = i + 1;
            const isActive = displayStep === stepNum;
            const isComplete = displayStep > stepNum;
            return (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                    ${isActive
                      ? "bg-blue-600 text-white"
                      : isComplete
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"}`}
                >
                  {isComplete ? "✓" : stepNum}
                </div>
                <span className={isActive ? "font-medium text-blue-700" : "text-gray-400"}>
                  {label}
                </span>
                {i < stepLabels.length - 1 && <span className="text-gray-300">›</span>}
              </div>
            );
          })}
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
      {state.step === 3 && (
        <Step3Medical
          children={state.children}
          familyInfo={state.familyInfo}
          onBack={() => goToStep(2)}
          onNext={(children) => {
            updateChildren(children);
            goToStep(hasPreKChild ? 4 : 5);
          }}
        />
      )}
      {state.step === 4 && hasPreKChild && (
        <Step4PreK
          children={state.children}
          onBack={() => goToStep(3)}
          onNext={(children) => {
            updateChildren(children);
            goToStep(5);
          }}
        />
      )}
      {state.step === 5 && (
        <Step4Agreements
          children={state.children}
          onBack={() => goToStep(hasPreKChild ? 4 : 3)}
          onNext={(children) => {
            updateChildren(children);
            goToStep(6);
          }}
        />
      )}
      {state.step === 6 && (
        <Step5SignSubmit
          state={state}
          onBack={() => goToStep(5)}
          onSubmitted={() => router.push("/enroll/confirmation")}
        />
      )}
    </div>
  );
}
