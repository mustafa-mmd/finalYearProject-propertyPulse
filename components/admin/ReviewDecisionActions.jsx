"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaShieldAlt,
  FaTimes,
} from "react-icons/fa";

const PRESET_REASONS = {
  REQUEST_CHANGES: [
    "Upload higher quality, un-watermarked property images",
    "Provide complete street address and postal code details",
    "Correct pricing information to reflect current market value",
    "Add detailed description outlining amenities and lease terms",
  ],
  REJECT: [
    "Inaccurate or fraudulent property documentation provided",
    "Violates platform terms of service and security guidelines",
    "Duplicate listing detected on platform",
    "Off-platform contact or prohibited transaction links in description",
  ],
  ESCALATE: [
    "High-risk pricing anomaly detected requiring senior review",
    "Unverified ownership documents flagged for compliance check",
    "Suspected identity spoofing or fraudulent account activity",
    "Needs legal and operations clearance before publishing",
  ],
};

export default function ReviewDecisionActions({
  verificationId,
  isDecided = false,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [decidedAction, setDecidedAction] = useState(null);

  // Modal State
  const [modalAction, setModalAction] = useState(null); // 'REQUEST_CHANGES' | 'REJECT' | 'ESCALATE'
  const [reasonText, setReasonText] = useState("");

  const openModal = (action) => {
    setModalAction(action);
    setReasonText("");
    setError("");
  };

  const closeModal = () => {
    setModalAction(null);
    setReasonText("");
    setError("");
  };

  async function executeDecision(action, reasonValue) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/verifications/${verificationId}/decision`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, reason: reasonValue }),
        }
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.error?.message || payload.message || "Decision failed."
        );
      }

      setDecidedAction(action);
      closeModal();

      if (action === "APPROVE") {
        toast.success("🚀 Property approved and published live!");
      } else {
        toast.info(`Verification updated to ${action.replace(/_/g, " ")}`);
      }

      router.refresh();
    } catch (requestError) {
      const msg = requestError.message || "Failed to submit decision";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleConfirmModal(e) {
    e.preventDefault();
    if (!reasonText.trim() || reasonText.trim().length < 10) {
      setError("Please provide a reason of at least 10 characters.");
      return;
    }
    executeDecision(modalAction, reasonText.trim());
  }

  if (decidedAction) {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
        <FaCheckCircle className="text-emerald-600 text-sm" />
        <span>
          Decision applied successfully ({decidedAction.replace(/_/g, " ")})
        </span>
      </div>
    );
  }

  const actionTitles = {
    REQUEST_CHANGES: "Request Listing Changes 📝",
    REJECT: "Reject Property Listing ❌",
    ESCALATE: "Escalate to Fraud & Operations 🛡️",
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Approve Button */}
        <button
          type="button"
          disabled={loading}
          onClick={() => executeDecision("APPROVE", "Approved after verification review")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
        >
          <FaCheckCircle className="text-xs" />
          <span>{loading ? "Approving…" : "Approve & Publish 🚀"}</span>
        </button>

        {/* Request Changes Button */}
        <button
          type="button"
          disabled={loading}
          onClick={() => openModal("REQUEST_CHANGES")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-600 active:scale-95 disabled:opacity-50"
        >
          <FaExclamationTriangle className="text-xs" />
          <span>Request Changes 📝</span>
        </button>

        {/* Reject Listing Button */}
        <button
          type="button"
          disabled={loading}
          onClick={() => openModal("REJECT")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-95 disabled:opacity-50"
        >
          <FaTimesCircle className="text-xs" />
          <span>Reject Listing ❌</span>
        </button>

        {/* Escalate Button */}
        <button
          type="button"
          disabled={loading}
          onClick={() => openModal("ESCALATE")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 active:scale-95 disabled:opacity-50"
        >
          <FaShieldAlt className="text-xs" />
          <span>Escalate</span>
        </button>
      </div>

      {error && !modalAction && (
        <p role="alert" className="text-xs font-semibold text-red-600">
          {error}
        </p>
      )}

      {/* ── MODAL DIALOG ── */}
      {modalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {actionTitles[modalAction]}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleConfirmModal} className="mt-4 space-y-4">
              <p className="text-xs text-slate-500">
                Select a standard reason or enter custom reviewer feedback below:
              </p>

              {/* Quick Preset Chips */}
              {PRESET_REASONS[modalAction] && (
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_REASONS[modalAction].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setReasonText(chip)}
                      className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              )}

              {/* Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Reviewer Reason / Feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  minLength={10}
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  placeholder="Provide detailed explanation for the property owner..."
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  {reasonText.length}/10 minimum characters
                </p>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 p-2.5 text-xs font-semibold text-red-600">
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || reasonText.trim().length < 10}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Saving…" : "Confirm Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
