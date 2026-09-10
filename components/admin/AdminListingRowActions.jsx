"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FaRocket, FaPause, FaEdit, FaEye, FaTrashAlt } from "react-icons/fa";

export default function AdminListingRowActions({ listingId, currentStatus }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const router = useRouter();

  const handleStatusChange = async (newStatus) => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error?.message || "Failed to update status");
      }

      setStatus(newStatus);
      if (newStatus === "PUBLISHED") {
        toast.success("🚀 Property published live on the platform!");
      } else if (newStatus === "DRAFT") {
        toast.info("Property set to Draft status.");
      } else {
        toast.success(`Listing status updated to ${newStatus}`);
      }
      router.refresh();
    } catch (err) {
      console.error("Status update error:", err);
      toast.error(err.message || "Failed to update property status");
    } finally {
      setLoading(false);
    }
  };

  const isPublished = status === "PUBLISHED";

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* 1. Quick Publish / Unpublish Toggle */}
      {!isPublished ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => handleStatusChange("PUBLISHED")}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
          title="Instantly publish this property live"
        >
          <FaRocket className="text-[11px]" />
          <span>{loading ? "Publishing…" : "Publish Now"}</span>
        </button>
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={() => handleStatusChange("DRAFT")}
          className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 text-amber-900 border border-amber-300 px-2 py-1 text-xs font-semibold hover:bg-amber-500/30 transition disabled:opacity-50"
          title="Revert status to Draft"
        >
          <FaPause className="text-[10px]" />
          <span>{loading ? "Updating…" : "Unpublish"}</span>
        </button>
      )}

      {/* 2. Edit Property */}
      <Link
        href={`/properties/${listingId}/edit`}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
        title="Edit property details"
      >
        <FaEdit className="text-[10px] text-slate-500" />
        <span>Edit</span>
      </Link>

      {/* 3. View Details */}
      <Link
        href={`/properties/${listingId}`}
        target="_blank"
        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
        title="View live public page"
      >
        <FaEye className="text-[10px]" />
        <span>View</span>
      </Link>
    </div>
  );
}
