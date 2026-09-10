"use client";

import { useState, useEffect } from "react";
import PropertyCard from "@/components/PropertyCard";
import Spinner from "./Spinner";
import Pagination from "./Pagination";
import { FaKey, FaHome, FaMoon, FaBuilding } from "react-icons/fa";

const PURPOSE_TABS = [
  { id: "", label: "All Properties", icon: FaBuilding },
  { id: "LONG_TERM_RENT", label: "For Rent", icon: FaKey },
  { id: "SALE", label: "For Sale", icon: FaHome },
  { id: "SHORT_TERM_RENT", label: "Short Stays", icon: FaMoon },
];

const Properties = ({ initialPurpose = "" }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [totalItems, setTotalItem] = useState(0);
  const [selectedPurpose, setSelectedPurpose] = useState(initialPurpose);

  useEffect(() => {
    setSelectedPurpose(initialPurpose);
  }, [initialPurpose]);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const purposeParam = selectedPurpose ? `&purpose=${encodeURIComponent(selectedPurpose)}` : "";
        const res = await fetch(`/api/prop?page=${page}&pageSize=${pageSize}${purposeParam}`);

        if (!res.ok) {
          throw new Error("Failed to fetch property data");
        }

        const data = await res.json();
        setProperties(data.properties || []);
        setTotalItem(data.total || 0);
      } catch (err) {
        console.error("[Properties] Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [page, pageSize, selectedPurpose]);

  const handlePurposeChange = (purposeId) => {
    setSelectedPurpose(purposeId);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <section className="px-4 py-8 bg-slate-50 min-h-[40rem]">
      <div className="container-xl lg:container m-auto max-w-7xl">
        {/* Purpose Filter Pills Bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex flex-wrap items-center gap-2">
            {PURPOSE_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = selectedPurpose === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handlePurposeChange(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all shadow-sm ${
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-2 ring-blue-600"
                      : "bg-white text-slate-700 hover:bg-slate-100 hover:text-blue-600 border border-slate-200"
                  }`}
                >
                  <Icon className={`text-xs ${active ? "text-white" : "text-slate-400"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Showing {totalItems} {selectedPurpose ? selectedPurpose.replaceAll("_", " ").toLowerCase() : "active"} listing{totalItems === 1 ? "" : "s"}
          </p>
        </div>

        {loading ? (
          <Spinner />
        ) : properties.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm my-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xl">
              <FaBuilding />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No properties found</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              There are currently no listings under this category. Try switching filters or check back later!
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property._id} property={property} />
              ))}
            </div>

            <div className="mt-8">
              <Pagination
                page={page}
                pageSize={pageSize}
                totalItem={totalItems}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Properties;