"use client";

import { useEffect, useRef, useState } from "react";

type ViewerStatus = { status: "loading" | "ready" | "error"; sha256?: string; message?: string };
type Props = { src: string; onStatus?: (s: ViewerStatus) => void };

/**
 * Renders every page of a PDF into canvases, sized to the container width.
 * pdf.js is loaded on the client only (it touches the DOM), and the bytes
 * come through our own route so the fetch stays same-origin.
 */
export default function PdfViewer({ src, onStatus }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{ status: "loading" | "ready" | "error"; pages: number; message?: string }>({
    status: "loading", pages: 0,
  });

  const onStatusRef = useRef(onStatus);
  useEffect(() => { onStatusRef.current = onStatus; });

  useEffect(() => {
    let cancelled = false;
    let loadingTask: { destroy: () => Promise<void> } | null = null;
    setState({ status: "loading", pages: 0 });
    onStatusRef.current?.({ status: "loading" });

    async function render() {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();

      const res = await fetch(src, { credentials: "same-origin" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Could not load the document (status ${res.status})`);
      }
      const data = new Uint8Array(await res.arrayBuffer());
      const digest = await crypto.subtle.digest("SHA-256", data);
      const sha256 = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
      const task = pdfjs.getDocument({ data });
      loadingTask = task;
      const pdf = await task.promise;
      if (cancelled) return;

      const container = containerRef.current;
      if (!container) return;
      container.innerHTML = "";
      const cssWidth = container.clientWidth || 360;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: (cssWidth / base.width) * dpr });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = "100%";
        canvas.style.display = "block";
        canvas.className = "border-b border-slate-200 last:border-b-0";
        if (cancelled) return;
        container.appendChild(canvas);
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        await page.render({ canvasContext: ctx, canvas, viewport }).promise;
        if (cancelled) return;
      }
      setState({ status: "ready", pages: pdf.numPages });
      onStatusRef.current?.({ status: "ready", sha256 });
    }

    render().catch((err) => {
      if (cancelled) return;
      const message = err instanceof Error ? err.message : String(err);
      setState({ status: "error", pages: 0, message });
      onStatusRef.current?.({ status: "error", message });
    });
    return () => {
      cancelled = true;
      loadingTask?.destroy().catch(() => {});
    };
  }, [src]);

  return (
    <div>
      {state.status === "loading" && (
        <div className="flex items-center gap-3 p-6 text-sm text-slate-500">
          <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          Loading document...
        </div>
      )}
      {state.status === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">{state.message}</div>
      )}
      <div ref={containerRef} className="bg-white rounded-lg border border-slate-200 overflow-hidden" />
      {state.status === "ready" && (
        <p className="text-xs text-slate-400 mt-2">{state.pages} page{state.pages === 1 ? "" : "s"}. Scroll to read the whole form.</p>
      )}
    </div>
  );
}
