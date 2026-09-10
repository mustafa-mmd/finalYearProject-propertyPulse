"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { FaBalanceScale } from "react-icons/fa";
import { toast } from "react-toastify";

export default function CompareButton({ propertyId, compact = false }) {
  const { status } = useSession();
  const [selected, setSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const toggle = async () => {
    if (status !== "authenticated") return toast.info("Sign in to compare properties.");
    setLoading(true);
    try {
      const response = await fetch("/api/property-collections", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "COMPARE", propertyId }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Comparison could not be updated");
      setSelected(payload.data.added);
      toast.success(payload.data.added ? "Added to comparison" : "Removed from comparison");
    } catch (error) { toast.error(error.message); } finally { setLoading(false); }
  };
  return <button type="button" disabled={loading} onClick={toggle} className={`${compact ? "px-3 py-2 text-sm" : "w-full px-4 py-3"} inline-flex items-center justify-center gap-2 rounded-full border font-bold transition ${selected ? "border-violet-600 bg-violet-600 text-white" : "border-violet-200 bg-white text-violet-700 hover:bg-violet-50"}`}><FaBalanceScale />{loading ? "Updating…" : selected ? "In comparison" : "Compare"}</button>;
}
