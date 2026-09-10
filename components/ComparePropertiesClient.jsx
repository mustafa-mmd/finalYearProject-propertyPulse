"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-toastify";
import {
  FaTimes,
  FaExternalLinkAlt,
  FaBalanceScale,
  FaPlus,
  FaTrash,
  FaBed,
  FaBath,
  FaRulerCombined,
  FaMapMarkerAlt,
  FaBuilding,
  FaDollarSign,
  FaCheckCircle,
  FaShieldAlt,
  FaLayerGroup,
} from "react-icons/fa";
import { buildLocationLabel } from "@/utils/location";

export default function ComparePropertiesClient({ initialProperties = [], availableSuggestions = [] }) {
  const [properties, setProperties] = useState(initialProperties);
  const [selectedToAdd, setSelectedToAdd] = useState("");

  const addProperty = async (propertyId) => {
    if (!propertyId) return;
    if (properties.some((p) => p._id === propertyId)) {
      toast.info("Property is already in your comparison table.");
      return;
    }

    if (properties.length >= 4) {
      toast.warning("You can compare up to 4 properties side by side.");
      return;
    }

    try {
      const response = await fetch("/api/property-collections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "COMPARE",
          propertyId,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Comparison could not be updated");

      const propObj = availableSuggestions.find((p) => p._id === propertyId);
      if (propObj) {
        setProperties((prev) => [...prev, propObj]);
      }
      setSelectedToAdd("");
      toast.success("Added to comparison matrix");
    } catch (error) {
      toast.error(error.message || "Failed to add property");
    }
  };

  const removeProperty = async (propertyId) => {
    try {
      const response = await fetch("/api/property-collections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "COMPARE",
          propertyId,
          remove: true,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Comparison could not be updated");

      setProperties((prev) => prev.filter((p) => p._id !== propertyId));
      toast.info("Removed from comparison");
    } catch (error) {
      toast.error(error.message || "Failed to remove property");
    }
  };

  const clearAll = async () => {
    for (const p of properties) {
      await removeProperty(p._id);
    }
    setProperties([]);
  };

  // Helper to format prices safely
  const formatPrice = (p) => {
    const curr = p.currency || "PKR";
    if (p.pricing?.salePrice) return `${curr} ${Number(p.pricing.salePrice).toLocaleString()}`;
    if (p.rates?.monthly?.price) return `${curr} ${Number(p.rates.monthly.price).toLocaleString()} / mo`;
    if (p.rates?.monthly) return `${curr} ${Number(p.rates.monthly).toLocaleString()} / mo`;
    if (p.pricing?.monthlyRent) return `${curr} ${Number(p.pricing.monthlyRent).toLocaleString()} / mo`;
    if (p.rates?.nightly?.price) return `${curr} ${Number(p.rates.nightly.price).toLocaleString()} / night`;
    if (p.rates?.nightly) return `${curr} ${Number(p.rates.nightly).toLocaleString()} / night`;
    return "Contact Owner";
  };

  // Spec Rows Definitions
  const SPEC_ROWS = [
    {
      id: "ref",
      label: "Listing Reference",
      icon: <FaLayerGroup className="text-blue-500" />,
      getValue: (p) => <span className="font-mono text-xs font-bold text-slate-800">{p.listingReference || "N/A"}</span>,
    },
    {
      id: "purpose",
      label: "Purpose",
      icon: <FaBuilding className="text-indigo-500" />,
      getValue: (p) => (
        <span className="inline-flex rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-extrabold text-indigo-700">
          {p.listingPurpose?.replaceAll("_", " ") || "RENT"}
        </span>
      ),
    },
    {
      id: "type",
      label: "Property Category",
      icon: <FaBuilding className="text-violet-500" />,
      getValue: (p) => <span className="font-bold text-slate-800">{p.type || p.listingCategory || "Apartment"}</span>,
    },
    {
      id: "location",
      label: "Location",
      icon: <FaMapMarkerAlt className="text-red-500" />,
      getValue: (p) => (
        <span className="text-xs text-slate-700 font-semibold line-clamp-2">
          {p.location?.formattedAddress || buildLocationLabel(p.location)}
        </span>
      ),
    },
    {
      id: "beds",
      label: "Bedrooms",
      icon: <FaBed className="text-blue-600" />,
      getValue: (p) => <span className="font-extrabold text-slate-900">{p.beds ?? "—"} Beds</span>,
    },
    {
      id: "baths",
      label: "Bathrooms",
      icon: <FaBath className="text-teal-500" />,
      getValue: (p) => <span className="font-extrabold text-slate-900">{p.baths ?? "—"} Baths</span>,
    },
    {
      id: "area",
      label: "Area / Size",
      icon: <FaRulerCombined className="text-amber-500" />,
      getValue: (p) =>
        p.square_feet ? (
          <span className="font-extrabold text-slate-900">{Number(p.square_feet).toLocaleString()} sq ft</span>
        ) : (
          "—"
        ),
    },
    {
      id: "nightly",
      label: "Nightly Rate",
      icon: <FaDollarSign className="text-amber-600" />,
      getValue: (p) => {
        const val = p.rates?.nightly?.price || p.rates?.nightly;
        return val ? (
          <span className="font-extrabold text-slate-900 bg-amber-50 px-2.5 py-1 rounded-lg text-amber-900">
            {p.currency || "PKR"} {Number(val).toLocaleString()}
          </span>
        ) : (
          <span className="text-slate-400 font-normal">—</span>
        );
      },
    },
    {
      id: "weekly",
      label: "Weekly Rate",
      icon: <FaDollarSign className="text-emerald-600" />,
      getValue: (p) => {
        const val = p.rates?.weekly?.price || p.rates?.weekly;
        return val ? (
          <span className="font-extrabold text-slate-900 bg-emerald-50 px-2.5 py-1 rounded-lg text-emerald-900">
            {p.currency || "PKR"} {Number(val).toLocaleString()}
          </span>
        ) : (
          <span className="text-slate-400 font-normal">—</span>
        );
      },
    },
    {
      id: "monthly",
      label: "Monthly Rent",
      icon: <FaDollarSign className="text-blue-600" />,
      getValue: (p) => {
        const val = p.rates?.monthly?.price || p.rates?.monthly || p.pricing?.monthlyRent;
        return val ? (
          <span className="font-extrabold text-slate-900 bg-blue-50 px-2.5 py-1 rounded-lg text-blue-900">
            {p.currency || "PKR"} {Number(val).toLocaleString()}
          </span>
        ) : (
          <span className="text-slate-400 font-normal">—</span>
        );
      },
    },
    {
      id: "sale",
      label: "Outright Sale Price",
      icon: <FaDollarSign className="text-emerald-700" />,
      getValue: (p) =>
        p.pricing?.salePrice ? (
          <span className="font-extrabold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl text-sm">
            {p.currency || "PKR"} {Number(p.pricing.salePrice).toLocaleString()}
          </span>
        ) : (
          <span className="text-slate-400 font-normal">—</span>
        ),
    },
    {
      id: "amenities",
      label: "Included Amenities",
      icon: <FaCheckCircle className="text-blue-500" />,
      getValue: (p) =>
        p.amenities?.length ? (
          <div className="flex flex-wrap gap-1 max-w-[220px]">
            {p.amenities.slice(0, 4).map((a, idx) => (
              <span key={idx} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                {a}
              </span>
            ))}
            {p.amenities.length > 4 && (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                +{p.amenities.length - 4} more
              </span>
            )}
          </div>
        ) : (
          "—"
        ),
    },
    {
      id: "verification",
      label: "Trust Verification",
      icon: <FaShieldAlt className="text-purple-600" />,
      getValue: (p) =>
        p.verification?.status === "VERIFIED" || p.listingStatus === "PUBLISHED" ? (
          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            ✓ Verified Listing
          </span>
        ) : (
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">Pending</span>
        ),
    },
  ];

  // Filter available suggestions not in properties list
  const unselectedSuggestions = availableSuggestions.filter((s) => !properties.some((p) => p._id === s._id));

  return (
    <div className="space-y-6">

      {/* Top Action & Control Panel */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          {/* Dropdown Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
            <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <FaPlus className="text-blue-600 text-xs" /> Add Property:
            </label>
            <select
              value={selectedToAdd}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedToAdd(val);
                if (val) addProperty(val);
              }}
              className="w-full sm:w-80 rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white shadow-sm"
            >
              <option value="">Select an active listing to add…</option>
              {unselectedSuggestions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.location?.city || "City"})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Suggestions Chips */}
          {unselectedSuggestions.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">Quick Add:</span>
              {unselectedSuggestions.slice(0, 3).map((s) => (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => addProperty(s._id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-600 hover:text-white shrink-0 shadow-sm"
                >
                  <FaPlus className="text-[10px]" />
                  <span className="truncate max-w-[140px]">{s.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Clear Comparison Table Button */}
          {properties.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-600 hover:text-white transition shadow-sm shrink-0 self-start md:self-auto"
            >
              <FaTrash className="text-xs" />
              <span>Clear Table ({properties.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Comparison Matrix Table or Empty State */}
      {!properties.length ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-16 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 text-3xl shadow-inner">
            <FaBalanceScale />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">Your Comparison Matrix is Empty</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto font-medium">
            Select properties from the dropdown above or click one of the quick suggestions to populate your side-by-side comparison table.
          </p>
          {unselectedSuggestions.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {unselectedSuggestions.slice(0, 3).map((s) => (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => addProperty(s._id)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
                >
                  <FaPlus /> Compare {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <table className="w-auto min-w-full border-collapse">
            {/* Table Header: Property Cards */}
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-5 text-left text-xs font-extrabold uppercase tracking-wider text-slate-400 w-[200px] min-w-[180px] bg-slate-100/60 align-bottom">
                  Property Spec
                </th>

                {properties.map((property) => (
                  <th key={property._id} className="p-5 text-left w-[260px] max-w-[280px] align-top border-l border-slate-200">
                    <div className="space-y-3 w-[240px] max-w-full">

                      {/* Image Card Container with Compact Fixed Height (Never Huge!) */}
                      <div className="relative h-36 sm:h-40 w-full overflow-hidden rounded-2xl border border-slate-200 shadow-md group">
                        {property.images?.[0] ? (
                          <Image
                            src={property.images[0]}
                            alt={property.name}
                            fill
                            sizes="240px"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 text-xs font-bold">
                            No Photo
                          </div>
                        )}

                        {/* Floating Price Badge */}
                        <div className="absolute bottom-2 left-2 rounded-xl bg-slate-900/90 backdrop-blur-md px-3 py-1 text-xs font-extrabold text-white shadow">
                          {formatPrice(property)}
                        </div>

                        {/* Floating Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeProperty(property._id)}
                          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-700 hover:bg-red-600 hover:text-white transition shadow-md"
                          title="Remove from comparison"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </div>

                      {/* Property Details */}
                      <div>
                        <Link
                          className="text-base font-extrabold text-slate-900 hover:text-blue-600 transition leading-snug line-clamp-2 block"
                          href={`/properties/${property._id}`}
                        >
                          {property.name}
                        </Link>
                        <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-1">
                          📍 {property.location?.city || "Location set"}
                        </p>
                      </div>

                      {/* Action Link */}
                      <Link
                        href={`/properties/${property._id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-800 transition"
                      >
                        Inspect Public Page <FaExternalLinkAlt className="text-[10px]" />
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Spec Rows */}
            <tbody className="divide-y divide-slate-200">
              {SPEC_ROWS.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`transition ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-blue-50/30`}
                >
                  <td className="p-5 font-bold text-slate-800 text-xs bg-slate-50/80 border-r border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{row.icon}</span>
                      <span>{row.label}</span>
                    </div>
                  </td>
                  {properties.map((property) => (
                    <td key={property._id} className="p-5 text-xs text-slate-800 font-medium border-l border-slate-200">
                      {row.getValue(property)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
