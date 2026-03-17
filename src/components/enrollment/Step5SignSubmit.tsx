"use client";

import { useRef, useState, useEffect } from "react";
import type { EnrollmentWizardState } from "@/types/enrollment";

type Props = {
  state: EnrollmentWizardState;
  onBack: () => void;
  onSubmitted: () => void;
};

const PROGRAM_LABELS: Record<string, string> = {
  INFANT: "Infant (8 weeks–12 months)",
  TODDLER: "Toddler (12–24 months)",
  PRESCHOOL: "Preschool (Ages 3–4)",
  PRE_K: "Pre-K Classroom (Ages 4–5)",
  AFTER_SCHOOL: "After-School Care (Ages 5–12)",
  SUMMER_CAMP_EAGLETS: "Summer Camp — Eaglets (Ages 5–7)",
  SUMMER_CAMP_EAGLES: "Summer Camp — Eagles (Ages 8–12)",
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export default function Step5SignSubmit({ state, onBack, onSubmitted }: Props) {
  const { familyInfo, children } = state;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasSigned, setHasSigned] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize canvas background to white
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  function getCanvasPoint(
    canvas: HTMLCanvasElement,
    clientX: number,
    clientY: number
  ): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function startDrawing(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    setHasSigned(true);
    lastPoint.current = getCanvasPoint(canvas, clientX, clientY);
  }

  function draw(clientX: number, clientY: number) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !lastPoint.current) return;
    const current = getCanvasPoint(canvas, clientX, clientY);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(current.x, current.y);
    ctx.strokeStyle = "#1e3a5f";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPoint.current = current;
  }

  function stopDrawing() {
    setIsDrawing(false);
    lastPoint.current = null;
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  }

  async function handleSubmit() {
    const canvas = canvasRef.current;
    if (!canvas || !hasSigned) return;
    const signature = canvas.toDataURL("image/png");
    const signatureDate = new Date().toISOString();

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/enrollment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyInfo,
          children,
          signature,
          signatureDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Submission failed. Please try again.");
        setIsSubmitting(false);
        return;
      }
      onSubmitted();
    } catch {
      setError("Network error. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Review &amp; Sign</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review your application details, then sign and submit below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Application Review Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 overflow-y-auto max-h-[600px]">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Application Summary</h3>

          {/* Family section */}
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Family</p>
            <div className="space-y-1 text-sm text-gray-700">
              <p>
                <span className="font-medium">Primary:</span>{" "}
                {familyInfo.firstName} {familyInfo.lastName} |{" "}
                {familyInfo.email} |{" "}
                {familyInfo.phone}
              </p>
              <p>
                <span className="font-medium">Address:</span>{" "}
                {familyInfo.address}, {familyInfo.city}, {familyInfo.state} {familyInfo.zip}
              </p>
              {familyInfo.parent2FirstName && (
                <p>
                  <span className="font-medium">Second Parent/Guardian:</span>{" "}
                  {familyInfo.parent2FirstName} {familyInfo.parent2LastName}
                </p>
              )}
            </div>
          </div>

          {/* Children section */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
              Children ({children.length})
            </p>
            <div className="space-y-4">
              {children.map((child, idx) => (
                <div key={child.tempId || idx} className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 space-y-1">
                  <p className="font-semibold text-gray-900">
                    {child.firstName} {child.lastName} —{" "}
                    {PROGRAM_LABELS[child.programType] || child.programType}{" "}
                    <span className="font-normal text-gray-500">
                      ({child.track === "PRE_K" ? "Georgia Pre-K" : "Universal"})
                    </span>
                  </p>
                  <p>DOB: {formatDate(child.dateOfBirth)}</p>
                  <p>Doctor: {child.doctorName || "Not provided"}</p>
                  {child.emergencyContacts && child.emergencyContacts.length > 0 && (
                    <p>
                      Emergency Contact 1: {child.emergencyContacts[0].name} |{" "}
                      {child.emergencyContacts[0].phone}
                    </p>
                  )}
                  {child.authorizedPickups && child.authorizedPickups.length > 0 && (
                    <p>
                      Pickup 1: {child.authorizedPickups[0].name} |{" "}
                      {child.authorizedPickups[0].relationship}
                    </p>
                  )}
                  {child.daysOfWeek && child.daysOfWeek.length > 0 && (
                    <p>Days: {child.daysOfWeek.join(", ")}</p>
                  )}
                  {child.mealPlan && child.mealPlan.length > 0 && (
                    <p>Meals: {child.mealPlan.join(", ")}</p>
                  )}
                  {child.usesTransportation && (
                    <p>Transportation: Yes — {child.transportPickupLocation}</p>
                  )}
                  {child.track === "PRE_K" && child.preKDocuments && (
                    <p>Pre-K documents: {child.preKDocuments.length} uploaded</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Signature Pad */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parent/Guardian Signature <span className="text-red-500">*</span>
            </label>
            <canvas
              ref={canvasRef}
              width={600}
              height={160}
              className="border border-gray-300 rounded-md w-full bg-white touch-none"
              style={{ height: "160px" }}
              // Mouse events
              onMouseDown={(e) => startDrawing(e.clientX, e.clientY)}
              onMouseMove={(e) => draw(e.clientX, e.clientY)}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              // Touch events
              onTouchStart={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                startDrawing(touch.clientX, touch.clientY);
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                draw(touch.clientX, touch.clientY);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                stopDrawing();
              }}
            />
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={clearSignature}
                className="px-3 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Sign with your mouse or finger above.
            </p>
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!hasSigned || isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Submitting…
                </>
              ) : (
                "Submit Application"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
