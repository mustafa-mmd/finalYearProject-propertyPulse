"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { FaTrash, FaBan, FaCheckCircle, FaUndo, FaExclamationTriangle, FaReceipt } from "react-icons/fa";

export default function CustomerPaymentOperations({
  initialPayments = [],
  initialRefunds = [],
  initialDisputes = [],
  isAdmin = false,
}) {
  const [payments, setPayments] = useState(initialPayments);
  const [refunds, setRefunds] = useState(initialRefunds);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [loadingId, setLoadingId] = useState(null);

  const handleAdminAction = async (paymentId, action) => {
    if (!isAdmin) return;

    if (action === "DELETE" && !window.confirm("Are you sure you want to remove this transaction record?")) {
      return;
    }

    setLoadingId(paymentId);
    try {
      const res = await fetch("/api/payment/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, action }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error?.message || "Action failed");
      }

      if (action === "REMOVE" || action === "DELETE") {
        setPayments((prev) => prev.filter((p) => p._id !== paymentId));
        toast.success("Transaction record removed");
      } else if (action === "MARK_PAID") {
        setPayments((prev) =>
          prev.map((p) => (p._id === paymentId ? { ...p, paymentStatus: "completed" } : p))
        );
        toast.success("Payment marked as completed!");
      } else {
        setPayments((prev) =>
          prev.map((p) => (p._id === paymentId ? { ...p, paymentStatus: "cancelled" } : p))
        );
        toast.info("Transaction cancelled");
      }
    } catch (err) {
      console.error("Payment action error:", err);
      toast.error(err.message || "Failed to process action");
    } finally {
      setLoadingId(null);
    }
  };

  const handleClearAllPending = async () => {
    if (!isAdmin) return;
    const pendingItems = payments.filter((p) => (p.paymentStatus || "").toLowerCase() === "pending");
    if (!pendingItems.length) {
      toast.info("No pending payments to clear.");
      return;
    }

    if (!window.confirm(`Clear all ${pendingItems.length} pending transactions?`)) return;

    for (const item of pendingItems) {
      await handleAdminAction(item._id, "DELETE");
    }
  };

  const requestRefund = async (payment) => {
    const amount = window.prompt(
      `Refund amount (maximum ${payment.currency} ${Math.max(0, payment.amount - (payment.refundedAmount || 0))})`
    );
    if (!amount) return;
    const reason = window.prompt("Explain why you are requesting a refund");
    if (!reason) return;

    try {
      const response = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment._id, amount, reason }),
      });
      const payload = await response.json();
      if (!response.ok) return toast.error(payload.error?.message || "Refund request failed");
      setRefunds((items) => [payload.data, ...items]);
      toast.success("Refund request submitted for finance review");
    } catch (err) {
      toast.error("Refund request failed");
    }
  };

  const openDispute = async (payment) => {
    const details = window.prompt("Describe the payment issue in detail");
    if (!details) return;

    try {
      const response = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment._id, reason: "OTHER", details }),
      });
      const payload = await response.json();
      if (!response.ok) return toast.error(payload.error?.message || "Dispute could not be opened");
      setDisputes((items) => [payload.data, ...items]);
      toast.success("Payment dispute opened");
    } catch (err) {
      toast.error("Dispute failed to open");
    }
  };

  const filteredPayments = payments.filter((p) => {
    const status = (p.paymentStatus || "").toLowerCase();
    if (filterStatus === "PENDING") return status === "pending";
    if (filterStatus === "COMPLETED") return status === "completed" || status === "paid";
    if (filterStatus === "CANCELLED") return status === "cancelled" || status === "failed";
    return true;
  });

  const getStatusBadgeClass = (statusStr) => {
    const s = (statusStr || "").toLowerCase();
    if (s === "completed" || s === "paid") return "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (s === "pending") return "bg-amber-100 text-amber-900 border-amber-300";
    if (s === "cancelled" || s === "failed") return "bg-red-100 text-red-800 border-red-300";
    return "bg-slate-100 text-slate-700 border-slate-300";
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Controls Bar: Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", "PENDING", "COMPLETED", "CANCELLED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                filterStatus === st
                  ? "bg-slate-900 text-white shadow"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "ALL" ? `All Transactions (${payments.length})` : st}
            </button>
          ))}
        </div>

        {/* Admin-only Bulk Clear Pending Button */}
        {isAdmin && (
          <button
            type="button"
            onClick={handleClearAllPending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition shadow-sm self-start sm:self-auto"
          >
            <FaTrash className="text-[11px]" />
            <span>Admin: Clear Pending Records</span>
          </button>
        )}
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredPayments.length ? (
          filteredPayments.map((payment) => {
            const statusLower = (payment.paymentStatus || "").toLowerCase();
            const refund = refunds.find((item) => String(item.paymentId?._id || item.paymentId) === payment._id);
            const dispute = disputes.find((item) => String(item.paymentId?._id || item.paymentId) === payment._id);
            const isProcessing = loadingId === payment._id;

            return (
              <article
                key={payment._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="font-bold text-slate-900 text-base">
                      {payment.propertyName || payment.userEmail || "Property Transaction"}
                    </h2>
                    <p className="font-mono text-xs text-slate-400 mt-0.5">
                      TXN: {payment.transactionId || payment._id}
                    </p>
                    <p className="mt-2 text-sm font-extrabold text-slate-900">
                      {payment.currency || "PKR"} {Number(payment.amount || 0).toLocaleString()}
                      <span className="ml-2 font-normal text-xs text-slate-500">
                        · {payment.paymentType || "Booking Payment"}
                      </span>
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-extrabold uppercase ${getStatusBadgeClass(
                      payment.paymentStatus
                    )}`}
                  >
                    {payment.paymentStatus || "PENDING"}
                  </span>
                </div>

                {/* User & Admin Action Buttons */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {/* ADMIN-ONLY override controls */}
                  {isAdmin && statusLower === "pending" && (
                    <>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleAdminAction(payment._id, "MARK_PAID")}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <FaCheckCircle className="text-[11px]" />
                        <span>{isProcessing ? "Updating…" : "Mark as Paid"}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleAdminAction(payment._id, "CANCEL")}
                        className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition disabled:opacity-50"
                      >
                        <FaBan className="text-[11px]" />
                        <span>Cancel Transaction</span>
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleAdminAction(payment._id, "DELETE")}
                        className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                      >
                        <FaTrash className="text-[11px]" />
                        <span>Remove Record</span>
                      </button>
                    </>
                  )}

                  {/* USER CUSTOMER PORTAL ACTIONS (For Completed Payments) */}
                  {(statusLower === "completed" || statusLower === "paid") && (
                    <>
                      {!refund && (
                        <button
                          type="button"
                          onClick={() => requestRefund(payment)}
                          className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                        >
                          <FaUndo className="text-[11px]" />
                          <span>Request Refund</span>
                        </button>
                      )}
                      {!dispute && (
                        <button
                          type="button"
                          onClick={() => openDispute(payment)}
                          className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
                        >
                          <FaExclamationTriangle className="text-[11px]" />
                          <span>Report Payment Issue</span>
                        </button>
                      )}
                      {refund && (
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg">
                          Refund Status: {refund.status}
                        </span>
                      )}
                      {dispute && (
                        <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-1 rounded-lg">
                          Dispute: {dispute.status}
                        </span>
                      )}
                    </>
                  )}

                  {/* Receipt Badge for completed payments */}
                  {(statusLower === "completed" || statusLower === "paid") && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl ml-auto">
                      <FaReceipt className="text-[11px] text-emerald-600" />
                      <span>Verified Receipt</span>
                    </span>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed bg-white p-12 text-center text-slate-500">
            No payments match the &quot;{filterStatus}&quot; filter.
          </div>
        )}
      </div>
    </div>
  );
}
