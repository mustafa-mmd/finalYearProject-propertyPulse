"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/context/I18nContext";
import SearchableCurrencySelect from "@/components/SearchableCurrencySelect";

export default function PreferenceSettingsForm({ preferences }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [currency, setCurrency] = useState(preferences?.currency || "ZAR");
  const [state, setState] = useState({ busy: false, message: "" });

  async function save(event) {
    event.preventDefault();
    setState({ busy: true, message: "" });

    const formData = new FormData(event.currentTarget);
    formData.set("currency", currency);

    const response = await fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });

    const payload = await response.json();
    setState({
      busy: false,
      message: response.ok
        ? "Preferences saved successfully."
        : payload.error?.message || "Could not save preferences.",
    });

    if (response.ok) router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <h2 className="text-xl font-extrabold text-slate-900">Regional &amp; Display Preferences</h2>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-bold text-slate-800">
          Language
          <select
            name="locale"
            defaultValue={preferences?.locale || "en"}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 outline-none focus:border-blue-500 transition"
          >
            <option value="en">English</option>
            <option value="ur">اردو</option>
            <option value="ar">العربية</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="es">Español</option>
          </select>
        </label>

        <div className="block text-sm font-bold text-slate-800">
          <label className="block mb-2">Preferred Currency</label>
          <input type="hidden" name="currency" value={currency} />
          <SearchableCurrencySelect
            value={currency}
            onChange={(code) => setCurrency(code)}
          />
        </div>
      </div>

      <label className="block text-sm font-bold text-slate-800">
        Timezone
        <input
          type="text"
          name="timezone"
          defaultValue={preferences?.timezone || "UTC"}
          maxLength={100}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-800 outline-none focus:border-blue-500 transition"
        />
      </label>

      {state.message && (
        <p
          aria-live="polite"
          className={`text-xs font-bold rounded-xl p-3 ${
            state.message.includes("success")
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={state.busy}
        className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-50"
      >
        {state.busy ? t("common.loading") : t("common.save")}
      </button>
    </form>
  );
}
