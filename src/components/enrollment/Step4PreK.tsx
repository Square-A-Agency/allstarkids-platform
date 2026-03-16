"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ChildEntry, PreKDocument } from "@/types/enrollment";

type Props = {
  children: ChildEntry[];
  onBack: () => void;
  onNext: (children: ChildEntry[]) => void;
};

type DocumentDef = {
  documentType: string;
  label: string;
  required: boolean | "unless_ssn_not_provided";
};

const DOCUMENT_LIST: DocumentDef[] = [
  { documentType: "BIRTH_CERTIFICATE", label: "Copy of Birth Certificate", required: true },
  { documentType: "SSN_CARD", label: "Copy of Social Security Card", required: "unless_ssn_not_provided" },
  { documentType: "MEDICAID_CARD", label: "Medicaid Card", required: false },
  { documentType: "PARENT_DL", label: "Parent/Guardian Driver's License", required: true },
  { documentType: "PROOF_OF_RESIDENCY", label: "Proof of Residency (lease, utility bill, or mortgage)", required: true },
  { documentType: "PEACH_CARE_CARD", label: "Peach Care Card", required: false },
  { documentType: "FORM_3300", label: "Form 3300: Eye, Ear, Dental & Nutrition Screening", required: true },
  { documentType: "FORM_3232", label: "Form 3232 (DHR): Immunization Certificate", required: true },
];

type UploadState = Record<string, "idle" | "uploading" | "done" | "error">;

function validateSsn(ssn: string): boolean {
  const cleaned = ssn.replace(/[-\s]/g, "");
  return /^\d{9}$/.test(cleaned) || /^\d{3}-\d{2}-\d{4}$/.test(ssn);
}

export default function Step4PreK({ children, onBack, onNext }: Props) {
  const preKChildren = children.filter((c) => c.track === "PRE_K");
  const [activeTab, setActiveTab] = useState(0);

  // Local state for each pre-k child keyed by tempId
  const [preKData, setPreKData] = useState<Record<string, Partial<ChildEntry>>>(() => {
    const init: Record<string, Partial<ChildEntry>> = {};
    for (const child of preKChildren) {
      init[child.tempId] = {
        nameSuffix: child.nameSuffix || "",
        preKSsn: child.preKSsn || "",
        preKSsnNotProvided: child.preKSsnNotProvided || false,
        preKSsnNotProvidedReason: child.preKSsnNotProvidedReason || "",
        preKCounty: child.preKCounty || "",
        preKPreviousSchool: child.preKPreviousSchool || "",
        preKLastDatePreviousSchool: child.preKLastDatePreviousSchool || "",
        preKLastHealthScreening: child.preKLastHealthScreening || "",
        preKDecalGeneralRelease: child.preKDecalGeneralRelease || false,
        preKDecalPhotoRelease: child.preKDecalPhotoRelease || false,
        preKDocuments: child.preKDocuments || [],
      };
    }
    return init;
  });

  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>(() => {
    const init: Record<string, UploadState> = {};
    for (const child of preKChildren) {
      init[child.tempId] = {};
    }
    return init;
  });

  const [uploadErrors, setUploadErrors] = useState<Record<string, Record<string, string>>>(() => {
    const init: Record<string, Record<string, string>> = {};
    for (const child of preKChildren) {
      init[child.tempId] = {};
    }
    return init;
  });

  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});

  function updateChild(tempId: string, updates: Partial<ChildEntry>) {
    setPreKData((prev) => ({
      ...prev,
      [tempId]: { ...prev[tempId], ...updates },
    }));
  }

  async function handleFileChange(
    child: ChildEntry,
    documentType: string,
    file: File | null
  ) {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadErrors((prev) => ({
        ...prev,
        [child.tempId]: {
          ...prev[child.tempId],
          [documentType]: "File exceeds 10MB limit. Please choose a smaller file.",
        },
      }));
      return;
    }

    // Clear previous error
    setUploadErrors((prev) => ({
      ...prev,
      [child.tempId]: { ...prev[child.tempId], [documentType]: "" },
    }));

    setUploadStates((prev) => ({
      ...prev,
      [child.tempId]: { ...prev[child.tempId], [documentType]: "uploading" },
    }));

    const path = `${child.tempId}/${documentType}/${file.name}`;
    const { error } = await supabase.storage
      .from("prek-documents")
      .upload(path, file, { upsert: true });

    if (error) {
      setUploadStates((prev) => ({
        ...prev,
        [child.tempId]: { ...prev[child.tempId], [documentType]: "error" },
      }));
      setUploadErrors((prev) => ({
        ...prev,
        [child.tempId]: {
          ...prev[child.tempId],
          [documentType]: `Upload failed: ${error.message}`,
        },
      }));
      return;
    }

    const { data: urlData } = supabase.storage
      .from("prek-documents")
      .getPublicUrl(path);

    const newDoc: PreKDocument = {
      documentType,
      fileName: file.name,
      fileUrl: urlData.publicUrl,
      fileSize: file.size,
      mimeType: file.type,
    };

    const existing = (preKData[child.tempId]?.preKDocuments || []).filter(
      (d) => d.documentType !== documentType
    );
    updateChild(child.tempId, { preKDocuments: [...existing, newDoc] });

    setUploadStates((prev) => ({
      ...prev,
      [child.tempId]: { ...prev[child.tempId], [documentType]: "done" },
    }));
  }

  function handleRemoveDoc(tempId: string, documentType: string) {
    const existing = (preKData[tempId]?.preKDocuments || []).filter(
      (d) => d.documentType !== documentType
    );
    updateChild(tempId, { preKDocuments: existing });
    setUploadStates((prev) => ({
      ...prev,
      [tempId]: { ...prev[tempId], [documentType]: "idle" },
    }));
  }

  function validate(): boolean {
    const newErrors: Record<string, Record<string, string>> = {};
    let firstFailingTab = -1;

    preKChildren.forEach((child, idx) => {
      const data = preKData[child.tempId] || {};
      const childErrors: Record<string, string> = {};

      if (!data.preKCounty?.trim()) {
        childErrors.preKCounty = "County of Residence is required.";
      }
      if (!data.preKLastHealthScreening?.trim()) {
        childErrors.preKLastHealthScreening = "Date of Last Full Health Screening is required.";
      }
      if (!data.preKDecalGeneralRelease) {
        childErrors.preKDecalGeneralRelease = "General Release authorization is required.";
      }
      if (!data.preKDecalPhotoRelease) {
        childErrors.preKDecalPhotoRelease = "Photograph/Videotape Release authorization is required.";
      }

      if (data.preKSsnNotProvided) {
        if (!data.preKSsnNotProvidedReason?.trim()) {
          childErrors.preKSsnNotProvidedReason = "Please provide a reason for not having an SSN.";
        }
      } else {
        if (data.preKSsn && !validateSsn(data.preKSsn)) {
          childErrors.preKSsn = "SSN must be 9 digits or in XXX-XX-XXXX format.";
        }
      }

      // Required documents
      const docs = data.preKDocuments || [];
      const uploaded = new Set(docs.map((d) => d.documentType));
      const requiredDocs = DOCUMENT_LIST.filter((doc) => {
        if (doc.required === true) return true;
        if (doc.required === "unless_ssn_not_provided" && !data.preKSsnNotProvided) return true;
        return false;
      });

      const missingDocs = requiredDocs.filter((doc) => !uploaded.has(doc.documentType));
      if (missingDocs.length > 0) {
        childErrors.documents = `Missing required documents: ${missingDocs.map((d) => d.label).join(", ")}`;
      }

      if (Object.keys(childErrors).length > 0) {
        newErrors[child.tempId] = childErrors;
        if (firstFailingTab === -1) firstFailingTab = idx;
      }
    });

    setErrors(newErrors);

    if (firstFailingTab !== -1) {
      setActiveTab(firstFailingTab);
      return false;
    }

    return true;
  }

  function handleNext() {
    if (!validate()) return;

    const updatedChildren = children.map((child) => {
      if (child.track !== "PRE_K") return child;
      const data = preKData[child.tempId] || {};
      return { ...child, ...data };
    });

    onNext(updatedChildren);
  }

  if (preKChildren.length === 0) {
    // Should not happen, but guard
    onNext(children);
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Georgia Pre-K Registration</h2>
      <p className="text-gray-500 text-sm mb-6">
        Complete the state-required fields and document uploads for your Pre-K child
        {preKChildren.length > 1 ? "ren" : ""}.
      </p>

      {/* Tabs for multiple Pre-K children */}
      {preKChildren.length > 1 && (
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {preKChildren.map((child, idx) => (
            <button
              key={child.tempId}
              onClick={() => setActiveTab(idx)}
              className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                activeTab === idx
                  ? "bg-white border border-b-white border-gray-200 text-blue-600 -mb-px"
                  : "text-gray-500 hover:text-gray-700"
              } ${errors[child.tempId] ? "text-red-500" : ""}`}
            >
              {child.firstName} {child.lastName}
              {errors[child.tempId] && <span className="ml-1 text-red-500">*</span>}
            </button>
          ))}
        </div>
      )}

      {preKChildren.map((child, idx) => {
        if (idx !== activeTab) return null;
        const data = preKData[child.tempId] || {};
        const childErrors = errors[child.tempId] || {};

        return (
          <div key={child.tempId}>
            {/* Section A: Georgia Pre-K Registration Fields */}
            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                A. Registration Fields — {child.firstName} {child.lastName}
              </h3>

              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 mb-4">
                Note: All names must match the child&apos;s birth certificate exactly.
              </p>

              {/* Name Suffix */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name Suffix
                </label>
                <input
                  type="text"
                  placeholder="Jr, Sr, II, III — leave blank if none"
                  value={data.nameSuffix || ""}
                  onChange={(e) => updateChild(child.tempId, { nameSuffix: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* SSN */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Social Security Number *
                </label>
                {!data.preKSsnNotProvided && (
                  <input
                    type="text"
                    placeholder="XXX-XX-XXXX"
                    value={data.preKSsn || ""}
                    onChange={(e) => updateChild(child.tempId, { preKSsn: e.target.value })}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      childErrors.preKSsn ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                )}
                {childErrors.preKSsn && (
                  <p className="text-red-500 text-xs mt-1">{childErrors.preKSsn}</p>
                )}
                <label className="flex items-center gap-2 mt-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.preKSsnNotProvided || false}
                    onChange={(e) =>
                      updateChild(child.tempId, { preKSsnNotProvided: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  SSN not available — I will provide a reason below
                </label>
                {data.preKSsnNotProvided && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason SSN Not Provided *
                    </label>
                    <textarea
                      value={data.preKSsnNotProvidedReason || ""}
                      onChange={(e) =>
                        updateChild(child.tempId, { preKSsnNotProvidedReason: e.target.value })
                      }
                      rows={3}
                      className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        childErrors.preKSsnNotProvidedReason ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {childErrors.preKSsnNotProvidedReason && (
                      <p className="text-red-500 text-xs mt-1">
                        {childErrors.preKSsnNotProvidedReason}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* County */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  County of Residence *
                </label>
                <input
                  type="text"
                  placeholder="e.g. DeKalb"
                  value={data.preKCounty || ""}
                  onChange={(e) => updateChild(child.tempId, { preKCounty: e.target.value })}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    childErrors.preKCounty ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {childErrors.preKCounty && (
                  <p className="text-red-500 text-xs mt-1">{childErrors.preKCounty}</p>
                )}
              </div>

              {/* Previous Pre-K School */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Previous Pre-K School (if applicable)
                </label>
                <input
                  type="text"
                  value={data.preKPreviousSchool || ""}
                  onChange={(e) =>
                    updateChild(child.tempId, { preKPreviousSchool: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Last Date Attended Previous School */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Date Attended (if applicable)
                </label>
                <input
                  type="date"
                  value={data.preKLastDatePreviousSchool || ""}
                  onChange={(e) =>
                    updateChild(child.tempId, { preKLastDatePreviousSchool: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Last Full Health Screening */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Last Full Health Screening *
                </label>
                <input
                  type="date"
                  value={data.preKLastHealthScreening || ""}
                  onChange={(e) =>
                    updateChild(child.tempId, { preKLastHealthScreening: e.target.value })
                  }
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    childErrors.preKLastHealthScreening ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {childErrors.preKLastHealthScreening && (
                  <p className="text-red-500 text-xs mt-1">
                    {childErrors.preKLastHealthScreening}
                  </p>
                )}
              </div>
            </section>

            {/* Section B: DECAL Releases */}
            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                B. DECAL Authorizations (State-Required)
              </h3>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-amber-800 mb-2">
                  DECAL (Georgia&apos;s Bright from the Start) requires the following authorizations:
                </p>
                <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                  <li>
                    <strong>General Release:</strong> Authorizes All Star Kids Academy to share
                    information with DECAL and the Georgia Department of Early Care and Learning
                    for program compliance.
                  </li>
                  <li>
                    <strong>Photograph/Videotape Release:</strong> Authorizes DECAL and its
                    contractors to photograph or videotape your child for program evaluation and
                    reporting purposes.
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.preKDecalGeneralRelease || false}
                    onChange={(e) =>
                      updateChild(child.tempId, { preKDecalGeneralRelease: e.target.checked })
                    }
                    className="mt-0.5 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">
                    I authorize the General Release as described above *
                  </span>
                </label>
                {childErrors.preKDecalGeneralRelease && (
                  <p className="text-red-500 text-xs ml-7">{childErrors.preKDecalGeneralRelease}</p>
                )}

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.preKDecalPhotoRelease || false}
                    onChange={(e) =>
                      updateChild(child.tempId, { preKDecalPhotoRelease: e.target.checked })
                    }
                    className="mt-0.5 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">
                    I authorize the Photograph and Videotape Release as described above *
                  </span>
                </label>
                {childErrors.preKDecalPhotoRelease && (
                  <p className="text-red-500 text-xs ml-7">{childErrors.preKDecalPhotoRelease}</p>
                )}
              </div>
            </section>

            {/* Section C: Document Uploads */}
            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                C. Required Documents
              </h3>

              <p className="text-sm text-gray-600 mb-4">
                Georgia Pre-K requires the following documents. Required documents must be
                uploaded before you can submit your application.
              </p>

              {childErrors.documents && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <p className="text-red-700 text-sm">{childErrors.documents}</p>
                </div>
              )}

              <div className="space-y-4">
                {DOCUMENT_LIST.map((doc) => {
                  const isRequired =
                    doc.required === true ||
                    (doc.required === "unless_ssn_not_provided" && !data.preKSsnNotProvided);
                  const uploadedDoc = (data.preKDocuments || []).find(
                    (d) => d.documentType === doc.documentType
                  );
                  const uploadStatus =
                    uploadStates[child.tempId]?.[doc.documentType] || "idle";
                  const uploadError =
                    uploadErrors[child.tempId]?.[doc.documentType] || "";

                  return (
                    <div
                      key={doc.documentType}
                      className="border border-gray-200 rounded-lg p-4 bg-white"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-800">
                              {doc.label}
                            </span>
                            {isRequired ? (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                                Required
                              </span>
                            ) : (
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                Optional
                              </span>
                            )}
                          </div>

                          {uploadedDoc ? (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-green-600 text-sm">
                                &#10003; {uploadedDoc.fileName}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveDoc(child.tempId, doc.documentType)
                                }
                                className="text-xs text-red-500 hover:text-red-700 underline"
                              >
                                Remove
                              </button>
                            </div>
                          ) : uploadStatus === "uploading" ? (
                            <p className="text-sm text-blue-600 mt-2">Uploading...</p>
                          ) : (
                            <div className="mt-2">
                              <label className="cursor-pointer inline-block">
                                <span className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md transition-colors">
                                  Choose file
                                </span>
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    handleFileChange(child, doc.documentType, file);
                                    // Reset input so same file can be re-selected after remove
                                    e.target.value = "";
                                  }}
                                />
                              </label>
                              {uploadStatus === "error" && (
                                <p className="text-red-500 text-xs mt-1">
                                  {uploadError || "Upload failed. Please try again."}
                                </p>
                              )}
                              {uploadError && uploadStatus !== "error" && (
                                <p className="text-red-500 text-xs mt-1">{uploadError}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        );
      })}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          Next Step →
        </button>
      </div>
    </div>
  );
}
