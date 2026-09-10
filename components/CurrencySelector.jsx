"use client";

import { useState, useEffect, useTransition } from "react";
import { DEFAULT_CURRENCY } from "@/utils/currency";
import SearchableCurrencySelect from "@/components/SearchableCurrencySelect";

/**
 * CurrencySelector
 * Renders a searchable dropdown that lets the signed-in user switch their preferred
 * display currency across all global currencies. Persists selection via PATCH /api/user/preferences.
 */
export default function CurrencySelector({ currentCurrency = DEFAULT_CURRENCY, onCurrencyChange, className = "" }) {
  const [selected, setSelected] = useState(currentCurrency);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  useEffect(() => {
    setSelected(currentCurrency);
  }, [currentCurrency]);

  async function handleCurrencyChange(newCode) {
    setSelected(newCode);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/user/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currency: newCode }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error?.message || "Failed to save currency preference");
        }
        onCurrencyChange?.(newCode);
      } catch (err) {
        setError(err.message);
        setSelected(currentCurrency); // revert on failure
      }
    });
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor="currency-selector" className="sr-only">
        Display currency
      </label>
      <SearchableCurrencySelect
        value={selected}
        onChange={handleCurrencyChange}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
