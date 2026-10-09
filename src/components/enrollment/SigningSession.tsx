"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PdfViewer from "./PdfViewer";
import SignaturePad from "./SignaturePad";
import { readJsonOrError } from "@/lib/api-response";

export type SigningDocument = {
  id: string;
  documentType: string;
  label: string;
  status: "to_sign" | "signed" | "preparing";
  signedAt: string | null;
};
export type SigningApplication = { id: string; childName: string; documents: SigningDocument[] };

type Props = { needsConsent: boolean; applications: SigningApplication[] };

export default function SigningSession({ needsConsent, applications: initial }: Props) {
  const router = useRouter();
  const [applications, setApplications] = useState(initial);
  const [consent, setConsent] = useState(!needsConsent);
  const [signature, setSignature] = useState<string | null>(null);
  const [padOpen, setPadOpen] = useState(false);
  const [padDraft, setPadDraft] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(() => firstToSign(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ key: string | null; status: "loading" | "ready" | "error"; sha256?: string }>({ key: null, status: "loading" });
  const [fallbackOpenedFor, setFallbackOpenedFor] = useState<string | null>(null);
  const [fallbackSha, setFallbackSha] = useState<{ id: string; sha256: string } | null>(null);

  const all = useMemo(() => applications.flatMap((a) => a.documents), [applications]);
  const signable = all.filter((d) => d.status !== "preparing");
  const signedCount = signable.filter((d) => d.status === "signed").length;
  const selected = all.find((d) => d.id === selectedId) ?? null;
  // Viewer state is keyed to the selected document and treated as loading
  // until the viewer reports for that document.
  const viewerKey = selected ? `${selected.id}-${selected.status}` : null;
  const viewerState = viewer.key === viewerKey ? viewer : { key: viewerKey, status: "loading" as const, sha256: undefined };
  const fallbackOpened = !!selected && fallbackOpenedFor === selected.id;

  async function sign(doc: SigningDocument) {
    if (!signature) { setPadOpen(true); return; }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/enrollment/documents/${doc.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature, consent, reviewedSha256: viewerState.sha256 ?? (fallbackSha?.id === doc.id ? fallbackSha.sha256 : undefined) }),
      });
      const { data, error: err } = await readJsonOrError<{ signedAt: string; applicationSigned: boolean; familySigned: boolean }>(res);
      if (err || !data) {
        if (res.status === 409 && err && /already signed/i.test(err)) {
          markSigned(doc.id, new Date().toISOString());
          setError(null);
          const next = firstToSign(applications, doc.id);
          if (!next || next === doc.id) {
            router.push("/enroll/confirmation?signed=1");
          } else {
            setSelectedId(next);
          }
          return;
        }
        setError(err ?? "Something went wrong. Please try again.");
        return;
      }
      markSigned(doc.id, data.signedAt);
      if (data.familySigned) {
        router.push("/enroll/confirmation?signed=1");
        return;
      }
      setSelectedId(firstToSign(applications, doc.id));
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  // When the in-page viewer cannot render, the parent reads the form in a new
  // tab. Hash the same bytes here so the server can still confirm what was shown.
  async function openFallback(id: string) {
    setFallbackOpenedFor(id);
    try {
      const res = await fetch(`/api/enrollment/documents/${id}`, { credentials: "same-origin" });
      if (!res.ok) return;
      const digest = await crypto.subtle.digest("SHA-256", await res.arrayBuffer());
      const sha256 = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
      setFallbackSha({ id, sha256 });
    } catch {
      // The server will ask the parent to review again if no hash arrives.
    }
  }

  function markSigned(id: string, signedAt: string) {
    setApplications((prev) =>
      prev.map((a) => ({
        ...a,
        documents: a.documents.map((d) => (d.id === id ? { ...d, status: "signed", signedAt } : d)),
      }))
    );
  }

  const canSign = consent && !busy && selected?.status === "to_sign" && (viewerState.status === "ready" || fallbackOpened);

  return (
    <div className="space-y-6">
      {/* Left: checklist */}
      <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Progress</p>
        <p className="text-2xl font-black text-slate-800 mt-1">{signedCount} of {signable.length} signed</p>
        <div className="h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-green-500 transition-all" style={{ width: `${signable.length ? (signedCount / signable.length) * 100 : 0}%` }} />
        </div>

        {needsConsent && (
          <label className="flex items-start gap-3 text-sm text-slate-700 mt-5 cursor-pointer">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="accent-blue-600 w-4 h-4 mt-0.5 shrink-0" />
            <span>I agree to review and sign my enrollment documents electronically.</span>
          </label>
        )}

        <div className="mt-5 space-y-4">
          {applications.map((app) => (
            <div key={app.id}>
              <p className="text-sm font-bold text-slate-800 mb-2">{app.childName}</p>
              <ul className="space-y-1">
                {app.documents.map((doc) => (
                  <li key={doc.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(doc.id)}
                      disabled={doc.status === "preparing"}
                      className={`w-full text-left text-sm rounded-lg px-3 py-2 flex items-center justify-between gap-2 border transition-colors ${
                        selectedId === doc.id ? "border-blue-400 bg-blue-50" : "border-transparent hover:bg-slate-50"
                      } disabled:opacity-60`}
                    >
                      <span className="truncate">{doc.label}</span>
                      <span className={`text-xs font-semibold shrink-0 ${
                        doc.status === "signed" ? "text-green-600" : doc.status === "preparing" ? "text-slate-400" : "text-amber-600"
                      }`}>
                        {doc.status === "signed" ? "Signed" : doc.status === "preparing" ? "Being prepared" : "To sign"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {signature && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Your signature</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={signature} alt="Your signature" className="h-12 bg-white border border-slate-200 rounded-md" />
            <button type="button" onClick={() => { setPadDraft(null); setPadOpen(true); }} className="text-xs text-blue-600 font-semibold mt-2">
              Draw again
            </button>
          </div>
        )}
      </aside>

      {/* Right: document */}
      <section>
        {selected ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selected.label}</h2>
                <p className="text-sm text-slate-500">Read the whole form, then sign at the bottom.</p>
              </div>
              {selected.status === "signed" && selected.signedAt && (
                <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
                  Signed {new Date(selected.signedAt).toLocaleDateString("en-US")}
                </span>
              )}
            </div>
            <PdfViewer
              key={viewerKey ?? undefined}
              src={`/api/enrollment/documents/${selected.id}`}
              onStatus={(s) => setViewer({ key: viewerKey, status: s.status, sha256: s.sha256 })}
            />
            {viewerState.status === "error" && (
              <a
                href={`/api/enrollment/documents/${selected.id}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { void openFallback(selected.id); }}
                className="inline-block text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                Open this form in a new tab
              </a>
            )}
            {error && <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">{error}</div>}
            <div className="sticky bottom-3">
              {selected.status === "to_sign" ? (
                <button
                  type="button"
                  onClick={() => sign(selected)}
                  disabled={!canSign}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy ? "Signing..." : viewerState.status === "loading" ? "Loading document..." : signature ? "Apply my signature" : "Sign this document"}
                </button>
              ) : (
                <p className="text-center text-sm text-slate-500 bg-white/90 rounded-xl py-2">This document is signed.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-14 text-center text-slate-500">
            {signable.length === 0 ? "Your documents are still being prepared. Check back in a few minutes." : "Everything is signed."}
          </div>
        )}
      </section>

      {padOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-5 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Draw your signature</h3>
            <p className="text-sm text-slate-500">It will be placed on each form you sign.</p>
            <p className="text-sm text-slate-500">Then tap Apply my signature on each form.</p>
            <SignaturePad onChange={setPadDraft} />
            <div className="flex gap-3">
              <button type="button" onClick={() => { setPadOpen(false); setPadDraft(null); }} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-md">
                Cancel
              </button>
              <button
                type="button"
                disabled={!padDraft}
                onClick={() => { setSignature(padDraft); setPadOpen(false); }}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md disabled:opacity-50"
              >
                Use this signature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function firstToSign(apps: SigningApplication[], after?: string): string | null {
  const docs = apps.flatMap((a) => a.documents);
  if (after) {
    const idx = docs.findIndex((d) => d.id === after);
    const later = docs.slice(idx + 1).find((d) => d.status === "to_sign" && d.id !== after);
    if (later) return later.id;
  }
  return docs.find((d) => d.status === "to_sign" && d.id !== after)?.id ?? (after ?? null);
}
