"use client";

import { useState } from "react";
import type { ChildEntry, FamilyInfo, EmergencyContact, AuthorizedPickup, InfantFeedingPlan } from "@/types/enrollment";

type Props = {
  children: ChildEntry[];
  familyInfo: FamilyInfo;
  onBack: () => void;
  onNext: (children: ChildEntry[]) => void;
};

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";
const sectionClass = "bg-white border border-gray-200 rounded-lg p-6 mb-6";
const sectionHeading = "text-base font-semibold text-gray-900 mb-4";

const LIVING_OPTIONS = [
  { value: "BOTH_PARENTS", label: "Both Parents" },
  { value: "MOTHER", label: "Mother" },
  { value: "FATHER", label: "Father" },
  { value: "OTHER", label: "Other" },
];

const defaultEmergencyContacts = (): EmergencyContact[] => [
  { name: "", phone: "", relationship: "" },
  { name: "", phone: "", relationship: "" },
  { name: "", phone: "", relationship: "" },
];

const defaultAuthorizedPickups = (): AuthorizedPickup[] => [
  { name: "", address: "", phone: "", relationship: "" },
  { name: "", address: "", phone: "", relationship: "" },
];

const defaultInfantFeedingPlan = (): InfantFeedingPlan => ({
  feedingMethod: "Bottle",
  formulaType: "",
  formulaAmount: "",
  formulaTimes: "",
  usesPacifier: false,
  solidFoodsReady: false,
  foodLikes: "",
  foodDislikes: "",
  foodAllergies: "",
});

function initChild(child: ChildEntry): ChildEntry {
  return {
    ...child,
    emergencyContacts: child.emergencyContacts ?? defaultEmergencyContacts(),
    authorizedPickups: child.authorizedPickups ?? defaultAuthorizedPickups(),
    infantFeedingPlan:
      child.programType === "INFANT_TODDLER"
        ? child.infantFeedingPlan ?? defaultInfantFeedingPlan()
        : child.infantFeedingPlan,
    doctorName: child.doctorName ?? "",
    doctorPhone: child.doctorPhone ?? "",
    specialNeeds: child.specialNeeds ?? "",
    specialAccommodations: child.specialAccommodations ?? "",
    medications: child.medications ?? "",
    allergies: child.allergies ?? "",
    currentSchool: child.currentSchool ?? "",
    livingArrangement: child.livingArrangement ?? "BOTH_PARENTS",
    legalGuardian: child.legalGuardian ?? "BOTH_PARENTS",
  };
}

function validateChild(child: ChildEntry): string | null {
  const ec = child.emergencyContacts ?? [];
  if (!ec[0]?.name?.trim()) return "Emergency Contact 1 name is required.";
  if (!ec[0]?.phone?.trim()) return "Emergency Contact 1 phone is required.";
  const ap = child.authorizedPickups ?? [];
  if (!ap[0]?.name?.trim()) return "Authorized Pickup 1 name is required.";
  if (!ap[0]?.phone?.trim()) return "Authorized Pickup 1 phone is required.";
  if (!ap[0]?.relationship?.trim()) return "Authorized Pickup 1 relationship is required.";
  if (!child.doctorName?.trim()) return "Doctor/Clinic name is required.";
  return null;
}

export default function Step3Medical({ children, familyInfo, onBack, onNext }: Props) {
  const [childData, setChildData] = useState<ChildEntry[]>(() =>
    children.map(initChild)
  );
  const [activeTab, setActiveTab] = useState(0);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const updateChild = (idx: number, partial: Partial<ChildEntry>) => {
    setChildData((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, ...partial } : c))
    );
  };

  const updateEC = (childIdx: number, ecIdx: number, partial: Partial<EmergencyContact>) => {
    setChildData((prev) =>
      prev.map((c, i) => {
        if (i !== childIdx) return c;
        const updated = [...(c.emergencyContacts ?? defaultEmergencyContacts())];
        updated[ecIdx] = { ...updated[ecIdx], ...partial };
        return { ...c, emergencyContacts: updated };
      })
    );
  };

  const updateAP = (childIdx: number, apIdx: number, partial: Partial<AuthorizedPickup>) => {
    setChildData((prev) =>
      prev.map((c, i) => {
        if (i !== childIdx) return c;
        const updated = [...(c.authorizedPickups ?? defaultAuthorizedPickups())];
        updated[apIdx] = { ...updated[apIdx], ...partial };
        return { ...c, authorizedPickups: updated };
      })
    );
  };

  const updateFeeding = (childIdx: number, partial: Partial<InfantFeedingPlan>) => {
    setChildData((prev) =>
      prev.map((c, i) => {
        if (i !== childIdx) return c;
        return {
          ...c,
          infantFeedingPlan: { ...(c.infantFeedingPlan ?? defaultInfantFeedingPlan()), ...partial },
        };
      })
    );
  };

  const handleNextChild = () => {
    const err = validateChild(childData[activeTab]);
    if (err) {
      setErrors((prev) => ({ ...prev, [activeTab]: err }));
      return;
    }
    setErrors((prev) => { const n = { ...prev }; delete n[activeTab]; return n; });
    setActiveTab((t) => t + 1);
  };

  const handleNext = () => {
    // Validate all children, not just the active tab
    const allErrors: Record<number, string> = {};
    childData.forEach((c, i) => {
      const err = validateChild(c);
      if (err) allErrors[i] = err;
    });
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      // Switch to the first child with an error
      const firstErrorIndex = Math.min(...Object.keys(allErrors).map(Number));
      setActiveTab(firstErrorIndex);
      return;
    }
    setErrors({});
    onNext(childData);
  };

  const child = childData[activeTab];
  const ec = child.emergencyContacts ?? defaultEmergencyContacts();
  const ap = child.authorizedPickups ?? defaultAuthorizedPickups();
  const isLastChild = activeTab === childData.length - 1;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Step 3: Medical Information</h2>
      <p className="text-sm text-gray-500 mb-6">
        Please provide medical and emergency information for each child.
      </p>

      {/* Tab bar */}
      {childData.length > 1 && (
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {childData.map((c, i) => (
            <button
              key={c.tempId}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
                activeTab === i
                  ? "border-blue-600 text-blue-700 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {c.firstName || `Child ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {errors[activeTab] && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
          {errors[activeTab]}
        </div>
      )}

      {/* Section A: Child Details */}
      <div className={sectionClass}>
        <h3 className={sectionHeading}>A. Child Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>School Child Attends (if applicable)</label>
            <input
              type="text"
              className={inputClass}
              value={child.currentSchool ?? ""}
              onChange={(e) => updateChild(activeTab, { currentSchool: e.target.value })}
            />
          </div>

          <div>
            <label className={labelClass}>
              Living Arrangements <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="flex flex-wrap gap-4 mt-1">
              {LIVING_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name={`living-${child.tempId}`}
                    value={opt.value}
                    checked={child.livingArrangement === opt.value}
                    onChange={() => updateChild(activeTab, { livingArrangement: opt.value })}
                    className="accent-blue-600"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Legal Guardian <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="flex flex-wrap gap-4 mt-1">
              {LIVING_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name={`guardian-${child.tempId}`}
                    value={opt.value}
                    checked={child.legalGuardian === opt.value}
                    onChange={() => updateChild(activeTab, { legalGuardian: opt.value })}
                    className="accent-blue-600"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section B: Emergency & Pickups */}
      <div className={sectionClass}>
        <h3 className={sectionHeading}>B. Emergency Contacts &amp; Authorized Pickups</h3>

        <p className="text-sm font-medium text-gray-700 mb-3">Emergency Contacts</p>
        {[0, 1, 2].map((i) => (
          <div key={i} className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
              Contact {i + 1} {i === 0 ? <span className="text-red-500 ml-1">*</span> : "(optional)"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>
                  Name {i === 0 && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  className={inputClass}
                  value={ec[i]?.name ?? ""}
                  onChange={(e) => updateEC(activeTab, i, { name: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Phone {i === 0 && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="tel"
                  className={inputClass}
                  value={ec[i]?.phone ?? ""}
                  onChange={(e) => updateEC(activeTab, i, { phone: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Relationship (optional)</label>
                <input
                  type="text"
                  className={inputClass}
                  value={ec[i]?.relationship ?? ""}
                  onChange={(e) => updateEC(activeTab, i, { relationship: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}

        <p className="text-sm font-medium text-gray-700 mb-3 mt-6">Authorized Pickups</p>
        {[0, 1].map((i) => (
          <div key={i} className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
              Pickup {i + 1} {i === 0 ? <span className="text-red-500 ml-1">*</span> : "(optional)"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>
                  Name {i === 0 && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  className={inputClass}
                  value={ap[i]?.name ?? ""}
                  onChange={(e) => updateAP(activeTab, i, { name: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Phone {i === 0 && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="tel"
                  className={inputClass}
                  value={ap[i]?.phone ?? ""}
                  onChange={(e) => updateAP(activeTab, i, { phone: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Relationship {i === 0 && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  className={inputClass}
                  value={ap[i]?.relationship ?? ""}
                  onChange={(e) => updateAP(activeTab, i, { relationship: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Address (optional)</label>
                <input
                  type="text"
                  className={inputClass}
                  value={ap[i]?.address ?? ""}
                  onChange={(e) => updateAP(activeTab, i, { address: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section C: Medical Info */}
      <div className={sectionClass}>
        <h3 className={sectionHeading}>C. Medical Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Doctor/Clinic Name <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              className={inputClass}
              value={child.doctorName ?? ""}
              onChange={(e) => updateChild(activeTab, { doctorName: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Doctor Phone</label>
            <input
              type="tel"
              className={inputClass}
              value={child.doctorPhone ?? ""}
              onChange={(e) => updateChild(activeTab, { doctorPhone: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Special Needs or Disabilities</label>
            <textarea
              className={inputClass}
              rows={3}
              value={child.specialNeeds ?? ""}
              onChange={(e) => updateChild(activeTab, { specialNeeds: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Required Accommodations</label>
            <textarea
              className={inputClass}
              rows={3}
              value={child.specialAccommodations ?? ""}
              onChange={(e) => updateChild(activeTab, { specialAccommodations: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Current Medications</label>
            <textarea
              className={inputClass}
              rows={3}
              value={child.medications ?? ""}
              onChange={(e) => updateChild(activeTab, { medications: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Allergies (food, medication, environmental)</label>
            <textarea
              className={inputClass}
              rows={3}
              value={child.allergies ?? ""}
              onChange={(e) => updateChild(activeTab, { allergies: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Section D: Infant Feeding Plan */}
      {child.programType === "INFANT_TODDLER" && (
        <div className={sectionClass}>
          <h3 className={sectionHeading}>D. Infant Feeding Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>
                Feeding Method <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="flex gap-6 mt-1">
                {["Bottle", "Self-feed", "Both"].map((method) => (
                  <label key={method} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name={`feeding-${child.tempId}`}
                      value={method}
                      checked={child.infantFeedingPlan?.feedingMethod === method}
                      onChange={() => updateFeeding(activeTab, { feedingMethod: method })}
                      className="accent-blue-600"
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Formula Type</label>
              <input
                type="text"
                className={inputClass}
                value={child.infantFeedingPlan?.formulaType ?? ""}
                onChange={(e) => updateFeeding(activeTab, { formulaType: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Formula Amount</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. 4 oz"
                value={child.infantFeedingPlan?.formulaAmount ?? ""}
                onChange={(e) => updateFeeding(activeTab, { formulaAmount: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Formula Times</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. 8am, 12pm, 4pm"
                value={child.infantFeedingPlan?.formulaTimes ?? ""}
                onChange={(e) => updateFeeding(activeTab, { formulaTimes: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id={`pacifier-${child.tempId}`}
                checked={child.infantFeedingPlan?.usesPacifier ?? false}
                onChange={(e) => updateFeeding(activeTab, { usesPacifier: e.target.checked })}
                className="accent-blue-600 w-4 h-4"
              />
              <label htmlFor={`pacifier-${child.tempId}`} className="text-sm text-gray-700">
                Uses Pacifier?
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id={`solid-${child.tempId}`}
                checked={child.infantFeedingPlan?.solidFoodsReady ?? false}
                onChange={(e) => updateFeeding(activeTab, { solidFoodsReady: e.target.checked })}
                className="accent-blue-600 w-4 h-4"
              />
              <label htmlFor={`solid-${child.tempId}`} className="text-sm text-gray-700">
                Ready for Solid Foods?
              </label>
            </div>
            <div>
              <label className={labelClass}>Food Likes</label>
              <input
                type="text"
                className={inputClass}
                value={child.infantFeedingPlan?.foodLikes ?? ""}
                onChange={(e) => updateFeeding(activeTab, { foodLikes: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Food Dislikes</label>
              <input
                type="text"
                className={inputClass}
                value={child.infantFeedingPlan?.foodDislikes ?? ""}
                onChange={(e) => updateFeeding(activeTab, { foodDislikes: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Food Allergies</label>
              <input
                type="text"
                className={inputClass}
                value={child.infantFeedingPlan?.foodAllergies ?? ""}
                onChange={(e) => updateFeeding(activeTab, { foodAllergies: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Back
        </button>
        <div className="flex gap-3">
          {!isLastChild && (
            <button
              onClick={handleNextChild}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Next Child →
            </button>
          )}
          {isLastChild && (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Next Step →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
