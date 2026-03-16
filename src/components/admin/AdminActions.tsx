"use client";

import { useState } from "react";

interface AdminActionsProps {
  applicationId: string;
  status: string;
  childName: string;
}

export default function AdminActions({ applicationId, status, childName }: AdminActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Playdate form state
  const [showPlaydateForm, setShowPlaydateForm] = useState(false);
  const [playdateDate, setPlaydateDate] = useState("");
  const [playdateNotes, setPlaydateNotes] = useState("");

  // Reject form state
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  async function postStatus(statusValue: string, extra?: Record<string, string>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusValue, ...extra }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Request failed");
      }
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  }

  async function schedulePlaydate() {
    if (!playdateDate) {
      setError("Please select a date.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/schedule-playdate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: playdateDate, notes: playdateNotes }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Request failed");
      }
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  }

  async function confirmReject() {
    if (!rejectionReason.trim()) {
      setError("Please enter a rejection reason.");
      return;
    }
    await postStatus("REJECTED", { rejectionReason: rejectionReason.trim() });
  }

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Admin Actions</h2>
      <p className="text-sm text-gray-500">
        Application for <span className="font-medium">{childName}</span>
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {/* Mark Under Review */}
        {status === "PENDING" && (
          <button
            onClick={() => postStatus("UNDER_REVIEW")}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
          >
            {loading ? "Processing..." : "Mark Under Review"}
          </button>
        )}

        {/* Schedule Playdate */}
        {(status === "PENDING" || status === "UNDER_REVIEW") && (
          <div>
            {!showPlaydateForm ? (
              <button
                onClick={() => setShowPlaydateForm(true)}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
              >
                Schedule Playdate
              </button>
            ) : (
              <div className="border border-purple-200 rounded-lg p-4 space-y-3 bg-purple-50">
                <p className="text-sm font-medium text-purple-900">Schedule a Playdate</p>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={playdateDate}
                    onChange={(e) => setPlaydateDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={playdateNotes}
                    onChange={(e) => setPlaydateNotes(e.target.value)}
                    rows={2}
                    placeholder="Any additional notes..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={schedulePlaydate}
                    disabled={loading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
                  >
                    {loading ? "Saving..." : "Confirm Playdate"}
                  </button>
                  <button
                    onClick={() => setShowPlaydateForm(false)}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Accept Application */}
        {status === "PLAYDATE_SCHEDULED" && (
          <button
            onClick={() => postStatus("ACCEPTED")}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
          >
            {loading ? "Processing..." : "Accept Application"}
          </button>
        )}

        {/* Reject Application */}
        {status !== "ACCEPTED" && status !== "REJECTED" && (
          <div>
            {!showRejectForm ? (
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
              >
                Reject Application
              </button>
            ) : (
              <div className="border border-red-200 rounded-lg p-4 space-y-3 bg-red-50">
                <p className="text-sm font-medium text-red-900">Reject Application</p>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    placeholder="Explain why this application is being rejected..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={confirmReject}
                    disabled={loading || !rejectionReason.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
                  >
                    {loading ? "Processing..." : "Confirm Rejection"}
                  </button>
                  <button
                    onClick={() => setShowRejectForm(false)}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
