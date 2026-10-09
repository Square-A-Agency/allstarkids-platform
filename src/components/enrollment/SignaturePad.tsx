"use client";

import { useRef, useState } from "react";

type Props = {
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
};

export default function SignaturePad({ onChange, disabled = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const drawingRef = useRef(false);
  const hasInkRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  function point(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function start(clientX: number, clientY: number) {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawingRef.current = true;
    lastPoint.current = point(canvas, clientX, clientY);
  }

  function move(clientX: number, clientY: number) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !lastPoint.current) return;
    const current = point(canvas, clientX, clientY);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(current.x, current.y);
    ctx.strokeStyle = "#1e3a5f";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPoint.current = current;
    hasInkRef.current = true;
    if (!hasInk) setHasInk(true);
  }

  function end() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPoint.current = null;
    const canvas = canvasRef.current;
    if (canvas && hasInkRef.current) onChange(canvas.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasInkRef.current = false;
    setHasInk(false);
    onChange(null);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={600}
        height={160}
        className="border border-gray-300 rounded-md w-full bg-white touch-none"
        style={{ height: "160px" }}
        onMouseDown={(e) => start(e.clientX, e.clientY)}
        onMouseMove={(e) => move(e.clientX, e.clientY)}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={(e) => { const t = e.touches[0]; start(t.clientX, t.clientY); }}
        onTouchMove={(e) => { const t = e.touches[0]; move(t.clientX, t.clientY); }}
        onTouchEnd={(e) => { e.preventDefault(); end(); }}
      />
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-500">Sign with your finger or mouse.</p>
        <button
          type="button"
          onClick={clear}
          disabled={disabled || !hasInk}
          className="px-3 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
