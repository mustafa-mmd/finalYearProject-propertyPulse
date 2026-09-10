"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AdminListingRowActions from "@/components/admin/AdminListingRowActions";
import { FaRocket, FaPause, FaTrash, FaCheckSquare } from "react-icons/fa";

function statusColor(status) {
  const map = {
    PUBLISHED: "bg-emerald-100 text-emerald-800",
    DRAFT: "bg-slate-100 text-slate-600",
    PENDING_AI_REVIEW: "bg-amber-100 text-amber-800",
    PENDING_MANUAL_REVIEW: "bg-amber-100 text-amber-800",
    CHANGES_REQUESTED: "bg-orange-100 text-orange-800",
    SUSPENDED: "bg-red-100 text-red-800",
    ARCHIVED: "bg-slate-100 text-slate-500",
  };
  return map[status] || "bg-slate-100 text-slate-600";
}

export default function AdminListingsTableClient({ listings = [] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const allSelected = listings.length > 0 && selectedIds.length === listings.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(listings.map((l) => l._id.toString()));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const executeBulkAction = async (action) => {
    if (!selectedIds.length) return;

    if (action === "DELETE" && !window.confirm(`Are you sure you want to archive/delete ${selectedIds.length} listing(s)?`)) {
      return;
    }

    setBulkLoading(true);
    try {
      const res = await fetch("/api/listings/bulk-edit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error?.message || "Bulk operation failed");
      }

      toast.success(
        `✅ Bulk ${action.toLowerCase()} applied to ${payload.data?.updated || selectedIds.length} listing(s)!`
      );
      setSelectedIds([]);
      router.refresh();
    } catch (err) {
      console.error("Bulk action error:", err);
      toast.error(err.message || "Failed to execute bulk action");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Floating Bulk Action Bar when items selected */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-slate-800 p-4 rounded-2xl text-white shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2 text-sm font-bold">
            <FaCheckSquare className="text-blue-400 text-base" />
            <span>{selectedIds.length} listing(s) selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={bulkLoading}
              onClick={() => executeBulkAction("PUBLISH")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
            >
              <FaRocket className="text-xs" />
              <span>Bulk Publish 🚀</span>
            </button>

            <button
              type="button"
              disabled={bulkLoading}
              onClick={() => executeBulkAction("UNPUBLISH")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition disabled:opacity-50"
            >
              <FaPause className="text-xs" />
              <span>Bulk Unpublish ⏸️</span>
            </button>

            <button
              type="button"
              disabled={bulkLoading}
              onClick={() => executeBulkAction("DELETE")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition disabled:opacity-50"
            >
              <FaTrash className="text-xs" />
              <span>Bulk Delete 🗑️</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Listings Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-extrabold text-slate-700 border-b border-slate-200">
            <tr>
              <th className="p-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                />
              </th>
              <th className="p-4">Property</th>
              <th className="p-4">Purpose</th>
              <th className="p-4">Location</th>
              <th className="p-4">Owner</th>
              <th className="p-4">Status</th>
              <th className="p-4">Verification</th>
              <th className="p-4">Score</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {listings.map((listing) => {
              const idStr = listing._id.toString();
              const isChecked = selectedIds.includes(idStr);
              const owner = listing.owner;
              const location = listing.location;
              const locationStr =
                [location?.city, location?.state].filter(Boolean).join(", ") || "—";

              return (
                <tr
                  key={idStr}
                  className={`transition ${isChecked ? "bg-blue-50/60" : "hover:bg-slate-50/80"}`}
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectRow(idStr)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {listing.images?.[0] && (
                        <Image
                          src={listing.images[0]}
                          alt=""
                          width={56}
                          height={40}
                          className="h-10 w-14 flex-none rounded-lg object-cover border border-slate-200"
                        />
                      )}
                      <div>
                        <p className="font-bold text-slate-900 max-w-[180px] truncate">
                          {listing.name}
                        </p>
                        <p className="font-mono text-[11px] text-slate-400">
                          {listing.listingReference || "No ref"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                      {listing.listingPurpose?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-medium text-slate-600">{locationStr}</td>
                  <td className="p-4">
                    {owner ? (
                      <div>
                        <p className="text-xs font-bold text-slate-900">{owner.name}</p>
                        <p className="text-[11px] text-slate-500">{owner.email}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">System</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${statusColor(listing.listingStatus)}`}>
                      {listing.listingStatus || "UNKNOWN"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        listing.verification?.status === "VERIFIED"
                          ? "bg-emerald-100 text-emerald-800"
                          : listing.verification?.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {listing.verification?.status || "UNVERIFIED"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${listing.completenessScore ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 font-bold">
                        {listing.completenessScore ?? 0}%
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <AdminListingRowActions
                      listingId={idStr}
                      currentStatus={listing.listingStatus || "DRAFT"}
                    />
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
