"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { SUPPORTED_CURRENCIES, getCurrency, detectUserCurrency, isSupportedCurrency } from "@/utils/currency";
import { FaSearch, FaChevronDown, FaCheck } from "react-icons/fa";

export default function SearchableCurrencySelect({
  value,
  onChange,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const detectedCode = useMemo(() => detectUserCurrency(), []);
  const activeCode = value || detectedCode || "PKR";

  const selectedCurrency = useMemo(() => getCurrency(activeCode), [activeCode]);

  const filteredCurrencies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      // Prioritize active currency, detected local currency (e.g. PKR), and top global currencies at top
      const topCodes = [activeCode, detectedCode, "PKR", "USD", "EUR", "GBP", "ZAR", "AED", "SAR"];
      const uniqueTopCodes = [...new Set(topCodes)].filter((c) => isSupportedCurrency(c));
      const topCurrencies = uniqueTopCodes.map((code) => getCurrency(code));
      const remainingCurrencies = SUPPORTED_CURRENCIES.filter((c) => !uniqueTopCodes.includes(c.code));
      return [...topCurrencies, ...remainingCurrencies];
    }
    return SUPPORTED_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        (c.country && c.country.toLowerCase().includes(q))
    );
  }, [search, activeCode, detectedCode]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  const handleSelect = (code) => {
    onChange?.(code);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 text-left font-semibold text-slate-800 shadow-sm transition hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <div className="flex items-center gap-2.5 truncate">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700 shrink-0">
            {selectedCurrency.symbol}
          </span>
          <span className="font-bold text-slate-900">{selectedCurrency.code}</span>
          <span className="text-slate-400 font-normal text-xs truncate">
            — {selectedCurrency.name} ({selectedCurrency.country})
          </span>
        </div>
        <FaChevronDown className={`text-slate-400 text-xs transition-transform duration-200 shrink-0 ml-2 ${open ? "rotate-180 text-blue-600" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-80 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5 animate-fadeIn">
          {/* Search Box */}
          <div className="border-b border-slate-150 p-3 bg-slate-50/80">
            <div className="relative flex items-center">
              <FaSearch className="absolute left-3 text-slate-400 text-xs" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country, currency or code..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Currencies List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
            {filteredCurrencies.length > 0 ? (
              filteredCurrencies.map((c) => {
                const isSelected = c.code === activeCode;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c.code)}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                      isSelected
                        ? "bg-blue-50 font-bold text-blue-900"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-extrabold shrink-0 ${isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                        {c.symbol}
                      </span>
                      <span className="font-extrabold text-slate-900 w-10 shrink-0">{c.code}</span>
                      <span className="truncate text-slate-600">
                        {c.name} <span className="text-slate-400">({c.country})</span>
                      </span>
                    </div>
                    {isSelected && <FaCheck className="text-blue-600 text-xs shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No currencies matching &quot;{search}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
