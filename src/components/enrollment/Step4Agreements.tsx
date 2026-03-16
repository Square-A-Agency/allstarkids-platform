"use client";

import { useState } from "react";
import type { ChildEntry, TopicalPreparations } from "@/types/enrollment";

type Props = {
  children: ChildEntry[];
  onBack: () => void;
  onNext: (children: ChildEntry[]) => void;
};

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";
const sectionClass = "bg-white border border-gray-200 rounded-lg p-6 mb-6";
const sectionHeading = "text-base font-semibold text-gray-900 mb-4";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const MEAL_OPTIONS = [
  { value: "Breakfast", label: "Breakfast (7:00 AM)" },
  { value: "Lunch", label: "Lunch (11:00 AM)" },
  { value: "PM Snack", label: "PM Snack (2:30 PM)" },
  { value: "Supper", label: "Supper (4:30 PM)" },
];

const TOPICAL_ITEMS: { key: keyof TopicalPreparations; label: string }[] = [
  { key: "babyWipes", label: "Baby Wipes" },
  { key: "bandaids", label: "Band-aids" },
  { key: "neosporin", label: "Neosporin" },
  { key: "bactine", label: "Bactine" },
  { key: "sunscreen", label: "Sunscreen" },
  { key: "insectRepellent", label: "Insect Repellent" },
  { key: "nonRxOintment", label: "Non-Rx Ointment" },
  { key: "babyPowder", label: "Baby Powder" },
];

const defaultTopical = (): TopicalPreparations => ({
  babyWipes: false,
  bandaids: false,
  neosporin: false,
  bactine: false,
  sunscreen: false,
  insectRepellent: false,
  nonRxOintment: false,
  babyPowder: false,
  other: "",
});

function initChild(child: ChildEntry): ChildEntry {
  return {
    ...child,
    enrollmentStartMonth: child.enrollmentStartMonth ?? "",
    enrollmentEndMonth: child.enrollmentEndMonth ?? "",
    daysOfWeek: child.daysOfWeek ?? [],
    startTime: child.startTime ?? "",
    endTime: child.endTime ?? "",
    mealPlan: child.mealPlan ?? [],
    topicalPreparations: child.topicalPreparations ?? defaultTopical(),
    usesTransportation: child.usesTransportation ?? false,
    transportPickupLocation: child.transportPickupLocation ?? "",
    transportPickupTime: child.transportPickupTime ?? "",
    transportDeliveryLocation: child.transportDeliveryLocation ?? "",
    transportDeliveryTime: child.transportDeliveryTime ?? "",
    transportDays: child.transportDays ?? [],
    transportAuthorizedPerson: child.transportAuthorizedPerson ?? "",
    transportFallbackProcedure: child.transportFallbackProcedure ?? "",
    noLiabilityAcknowledged: child.noLiabilityAcknowledged ?? false,
  };
}

function validateChild(child: ChildEntry): string | null {
  if (!child.enrollmentStartMonth) return "Enrollment start month is required.";
  if (!child.enrollmentEndMonth) return "Enrollment end month is required.";
  if (!child.daysOfWeek || child.daysOfWeek.length === 0) return "Please select at least one day of the week.";
  if (!child.startTime) return "Start time is required.";
  if (!child.endTime) return "End time is required.";
  if (!child.noLiabilityAcknowledged) return "You must acknowledge the no-liability notice to continue.";
  return null;
}

export default function Step4Agreements({ children, onBack, onNext }: Props) {
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

  const updateTopical = (idx: number, partial: Partial<TopicalPreparations>) => {
    setChildData((prev) =>
      prev.map((c, i) => {
        if (i !== idx) return c;
        return {
          ...c,
          topicalPreparations: { ...(c.topicalPreparations ?? defaultTopical()), ...partial },
        };
      })
    );
  };

  const toggleArrayItem = (idx: number, field: "daysOfWeek" | "mealPlan" | "transportDays", value: string) => {
    setChildData((prev) =>
      prev.map((c, i) => {
        if (i !== idx) return c;
        const arr = (c[field] ?? []) as string[];
        const updated = arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value];
        return { ...c, [field]: updated };
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
  const topical = child.topicalPreparations ?? defaultTopical();
  const isLastChild = activeTab === childData.length - 1;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Step 4: Agreements &amp; Schedule</h2>
      <p className="text-sm text-gray-500 mb-6">
        Please set schedule preferences, meal plan, and confirm agreements for each child.
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

      {/* Section A: Schedule */}
      <div className={sectionClass}>
        <h3 className={sectionHeading}>A. Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Enrollment Start Month <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              className={inputClass}
              value={child.enrollmentStartMonth ?? ""}
              onChange={(e) => updateChild(activeTab, { enrollmentStartMonth: e.target.value })}
            >
              <option value="">Select month...</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>
              Enrollment End Month <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              className={inputClass}
              value={child.enrollmentEndMonth ?? ""}
              onChange={(e) => updateChild(activeTab, { enrollmentEndMonth: e.target.value })}
            >
              <option value="">Select month...</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>
              Days of Week <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="flex flex-wrap gap-4 mt-1">
              {DAYS_OF_WEEK.map((day) => (
                <label key={day} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(child.daysOfWeek ?? []).includes(day)}
                    onChange={() => toggleArrayItem(activeTab, "daysOfWeek", day)}
                    className="accent-blue-600 w-4 h-4"
                  />
                  {day}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Start Time <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="time"
              className={inputClass}
              value={child.startTime ?? ""}
              onChange={(e) => updateChild(activeTab, { startTime: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>
              End Time <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="time"
              className={inputClass}
              value={child.endTime ?? ""}
              onChange={(e) => updateChild(activeTab, { endTime: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Section B: Meal Plan */}
      <div className={sectionClass}>
        <h3 className={sectionHeading}>B. Meal Plan</h3>
        <div className="flex flex-col gap-3">
          {MEAL_OPTIONS.map((meal) => (
            <label key={meal.value} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={(child.mealPlan ?? []).includes(meal.value)}
                onChange={() => toggleArrayItem(activeTab, "mealPlan", meal.value)}
                className="accent-blue-600 w-4 h-4"
              />
              {meal.label}
            </label>
          ))}
        </div>
      </div>

      {/* Section C: Topical Preparations */}
      <div className={sectionClass}>
        <h3 className={sectionHeading}>C. Authorization to Dispense Topical Preparations</h3>
        <p className="text-sm text-gray-600 mb-4">
          I authorize All Star Kids Academy staff to apply the following products to my child when needed:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {TOPICAL_ITEMS.map((item) => (
            <label key={item.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={!!(topical[item.key])}
                onChange={(e) => updateTopical(activeTab, { [item.key]: e.target.checked })}
                className="accent-blue-600 w-4 h-4"
              />
              {item.label}
            </label>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-700 font-medium whitespace-nowrap">Other:</label>
          <input
            type="text"
            className={inputClass}
            placeholder="Specify other product..."
            value={topical.other}
            onChange={(e) => updateTopical(activeTab, { other: e.target.value })}
          />
        </div>
      </div>

      {/* Section D: Transportation */}
      <div className={sectionClass}>
        <h3 className={sectionHeading}>D. Transportation</h3>
        <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={child.usesTransportation ?? false}
            onChange={(e) => updateChild(activeTab, { usesTransportation: e.target.checked })}
            className="accent-blue-600 w-4 h-4"
          />
          My child will need transportation services
        </label>

        {child.usesTransportation && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <label className={labelClass}>Pickup Location</label>
              <input
                type="text"
                className={inputClass}
                value={child.transportPickupLocation ?? ""}
                onChange={(e) => updateChild(activeTab, { transportPickupLocation: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Pickup Time</label>
              <input
                type="time"
                className={inputClass}
                value={child.transportPickupTime ?? ""}
                onChange={(e) => updateChild(activeTab, { transportPickupTime: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Delivery Location</label>
              <input
                type="text"
                className={inputClass}
                value={child.transportDeliveryLocation ?? ""}
                onChange={(e) => updateChild(activeTab, { transportDeliveryLocation: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Delivery Time</label>
              <input
                type="time"
                className={inputClass}
                value={child.transportDeliveryTime ?? ""}
                onChange={(e) => updateChild(activeTab, { transportDeliveryTime: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Transport Days</label>
              <div className="flex flex-wrap gap-4 mt-1">
                {DAYS_OF_WEEK.map((day) => (
                  <label key={day} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(child.transportDays ?? []).includes(day)}
                      onChange={() => toggleArrayItem(activeTab, "transportDays", day)}
                      className="accent-blue-600 w-4 h-4"
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Authorized Person to Receive Child</label>
              <input
                type="text"
                className={inputClass}
                value={child.transportAuthorizedPerson ?? ""}
                onChange={(e) => updateChild(activeTab, { transportAuthorizedPerson: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>
                What should we do if authorized person is unavailable?
              </label>
              <textarea
                className={inputClass}
                rows={3}
                value={child.transportFallbackProcedure ?? ""}
                onChange={(e) => updateChild(activeTab, { transportFallbackProcedure: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Section E: No Liability Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
        <h3 className="text-base font-semibold text-amber-900 mb-3">E. No Liability Notice</h3>
        <p className="text-sm text-amber-800 mb-4 leading-relaxed">
          <strong>NOTICE:</strong> All Star Kids Academy does not carry sufficient liability insurance to cover all
          potential claims. By checking the box below, you acknowledge that you have read and understand this notice.
        </p>
        <label className="flex items-start gap-3 text-sm text-amber-900 cursor-pointer">
          <input
            type="checkbox"
            checked={child.noLiabilityAcknowledged ?? false}
            onChange={(e) => updateChild(activeTab, { noLiabilityAcknowledged: e.target.checked })}
            className="accent-amber-600 w-4 h-4 mt-0.5 shrink-0"
          />
          <span>
            I acknowledge and accept this notice <span className="text-red-500 ml-1">*</span>
          </span>
        </label>
      </div>

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
