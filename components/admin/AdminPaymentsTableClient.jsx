"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FaCheckCircle, FaBan, FaTrash } from "react-icons/fa";

export default function AdminPaymentsTableClient({ initialPayments = [] }) {
  const router = useRouter();
  const [payments, setPayments] = useState(initialPayments);
  const [loadingId, setLoadingId] = useState(null);

  const handleAdminAction = async (paymentId, action) => {
    if (action === "DELETE" && !window.confirm("Are you sure you want to remove this payment record?")) {
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
        toast.success("Payment record removed");
      } else if (action === "MARK_PAID") {
        setPayments((prev) =>
          prev.map((p) => (p._id === paymentId ? { ...p, paymentStatus: "completed" } : p))
        );
        toast.success("Payment status set to Completed!");
      } else {
        setPayments((prev) =>
          prev.map((p) => (p._id === paymentId ? { ...p, paymentStatus: "cancelled" } : p))
        );
        toast.info("Payment set to Cancelled");
      }
      router.refresh();
    } catch (err) {
      console.error("Admin payment error:", err);
      toast.error(err.message || "Failed to process payment action");
    } finally {
      setLoadingId(null);
    }
  };

  const handleClearAllPending = async () => {
    const pendingItems = payments.filter((p) => (p.paymentStatus || "").toLowerCase() === "pending");
    if (!pendingItems.length) {
      toast.info("No pending payments to clear.");
      return;
    }

    if (!window.confirm(`Clear all ${pendingItems.length} pending transactions from system?`)) return;

    for (const item of pendingItems) {
      await handleAdminAction(item._id, "DELETE");
    }
  };

  const statusBadge = (s) => {
    const status = (s || "").toLowerCase();
    if (status === "completed" || status === "paid") return "bg-emerald-100 text-emerald-800";
    if (status === "pending") return "bg-amber-100 text-amber-800";
    if (status === "cancelled" || status === "failed") return "bg-red-100 text-red-800";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="space-y-4">
      {/* Header controls for Admin */}
      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
        <p className="text-xs font-bold text-slate-700">Admin Operations ({payments.length} Records)</p>
        <button
          type="button"
          onClick={handleClearAllPending}
          className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition"
        >
          <FaTrash className="text-[10px]" />
          <span>Clear All Pending ({payments.filter((p) => (p.paymentStatus || "").toLowerCase() === "pending").length})</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-600">
            <tr className="text-left">
              <th className="px-3 py-3">Transaction ID</th>
              <th className="px-3 py-3">Property</th>
              <th className="px-3 py-3">Customer Email</th>
              <th className="px-3 py-3">Amount</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Admin Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {payments.map((payment) => {
              const statusLower = (payment.paymentStatus || "").toLowerCase();
              const isProcessing = loadingId === payment._id;

              return (
                <tr key={payment._id} className="hover:bg-slate-50/60 transition">
                  <td className="px-3 py-3.5 font-mono text-xs text-slate-700">{payment.transactionId || payment._id}</td>
                  <td className="px-3 py-3.5 font-bold text-slate-900">{payment.propertyName || "—"}</td>
                  <td className="px-3 py-3.5 text-slate-600 text-xs">{payment.userEmail || "—"}</td>
                  <td className="px-3 py-3.5 font-extrabold text-slate-900">
                    {payment.currency || "PKR"} {Number(payment.amount || 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold uppercase ${statusBadge(payment.paymentStatus)}`}>
                      {payment.paymentStatus || "PENDING"}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {statusLower === "pending" && (
                        <>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleAdminAction(payment._id, "MARK_PAID")}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition"
                            title="Mark as completed/paid"
                          >
                            <FaCheckCircle className="text-[10px]" />
                            <span>Mark Paid</span>
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleAdminAction(payment._id, "CANCEL")}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
                            title="Cancel transaction"
                          >
                            <FaBan className="text-[10px]" />
                            <span>Cancel</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleAdminAction(payment._id, "DELETE")}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-100 transition"
                        title="Delete payment record"
                      >
                        <FaTrash className="text-[10px]" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
