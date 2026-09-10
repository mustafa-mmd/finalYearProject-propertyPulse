"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

/** yyyy-MM-dd from a Date */
function toInputDate(date) {
  return date.toISOString().slice(0, 10);
}

/** Advance a yyyy-MM-dd string by N days */
function addDays(dateStr, n) {
  return toInputDate(new Date(new Date(dateStr).getTime() + n * 86_400_000));
}

/** Calendar nights between two date strings */
function calcNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return diff > 0 ? Math.round(diff / 86_400_000) : 0;
}

/**
 * Stay-type presets.
 * Only rendered for SHORT_TERM_RENT bookings.
 */
const STAY_TYPES = [
  { id: "nightly",  label: "Nightly",  icon: "🌙", nights: 1,  rateKey: "nightlyRate" },
  { id: "weekly",   label: "Weekly",   icon: "📅", nights: 7,  rateKey: "weeklyRate"  },
  { id: "monthly",  label: "Monthly",  icon: "🏠", nights: 30, rateKey: "monthlyRate" },
  { id: "custom",   label: "Custom",   icon: "✏️", nights: null, rateKey: null        },
];

/**
 * PropertyWorkflowForm
 *
 * Props
 * ─────
 * mode            "booking" | "application"
 * listingPurpose  "SHORT_TERM_RENT" | "LONG_TERM_RENT" | "SALE" | …
 *                 Stay-type picker is ONLY shown when:
 *                   mode === "booking" AND listingPurpose === "SHORT_TERM_RENT"
 * propertyId      string
 * nightlyRate     number (price per night)
 * weeklyRate      number (price per week, 0 = not available)
 * monthlyRate     number (price per month, 0 = not available)
 * currency        "ZAR" | …
 * defaultCheckIn  yyyy-MM-dd  (computed server-side, avoids hydration mismatch)
 * defaultCheckOut yyyy-MM-dd
 * minCheckIn      yyyy-MM-dd
 */
export default function PropertyWorkflowForm({
  mode            = "booking",
  listingPurpose  = "",
  propertyId,
  nightlyRate  = 0,
  weeklyRate   = 0,
  monthlyRate  = 0,
  currency     = "ZAR",
  defaultCheckIn  = "",
  defaultCheckOut = "",
  minCheckIn      = "",
}) {
  const router = useRouter();

  // ── Show the stay-type picker only for SHORT_TERM_RENT bookings ──
  const showStayPicker =
    mode === "booking" && listingPurpose === "SHORT_TERM_RENT";

  // ── Booking state ──
  const [stayType, setStayType] = useState("nightly");
  const [checkIn,  setCheckIn]  = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [guests,   setGuests]   = useState(1);

  // ── Rental-application state ──
  const [desiredMoveIn,    setDesiredMoveIn]    = useState(defaultCheckIn);
  const [occupants,        setOccupants]        = useState(1);
  const [monthlyIncome,    setMonthlyIncome]    = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [creditCheck,      setCreditCheck]      = useState(false);
  const [privacyPolicy,    setPrivacyPolicy]    = useState(false);

  // ── Shared state ──
  const [message, setMessage] = useState("");
  const [error,   setError]   = useState("");
  const [saving,  setSaving]  = useState(false);

  const settings =
    mode === "booking"
      ? { endpoint: "/api/bookings",            redirect: "/bookings",            title: "Request a booking" }
      : { endpoint: "/api/rental-applications", redirect: "/rental-applications", title: "Apply to rent" };

  // ── Derived values ──
  const nights = mode === "booking" ? calcNights(checkIn, checkOut) : 0;

  // Effective per-night rate based on selected stay type
  function effectiveNightlyRate() {
    if (stayType === "weekly"  && weeklyRate  > 0) return weeklyRate  / 7;
    if (stayType === "monthly" && monthlyRate > 0) return monthlyRate / 30;
    return nightlyRate;
  }
  const perNight = effectiveNightlyRate();
  const subtotal = nights > 0 ? Math.round(nights * perNight) : 0;

  // Locked checkout for preset stay types
  const isCheckoutLocked = showStayPicker && stayType !== "custom";
  const minCheckOut = checkIn ? addDays(checkIn, 1) : defaultCheckOut;

  // ── Handlers ──
  /** Switch stay type and auto-set checkout for preset durations */
  const handleStayType = useCallback(
    (type) => {
      setStayType(type);
      setError("");
      const preset = STAY_TYPES.find((t) => t.id === type);
      if (preset?.nights && checkIn) {
        setCheckOut(addDays(checkIn, preset.nights));
      }
      // "custom" — leave dates as-is
    },
    [checkIn]
  );

  /** When check-in changes, push checkout forward for preset modes */
  const handleCheckInChange = useCallback(
    (e) => {
      const val = e.target.value;
      setCheckIn(val);
      const preset = STAY_TYPES.find((t) => t.id === stayType);
      if (preset?.nights) {
        setCheckOut(addDays(val, preset.nights));
      } else if (checkOut && checkOut <= val) {
        setCheckOut(addDays(val, 1));
      }
    },
    [stayType, checkOut]
  );

  async function handleSubmit(event, isInstantPay = false) {
    if (event && event.preventDefault) event.preventDefault();
    setError("");

    if (mode === "booking") {
      if (nights < 1) {
        setError("Check-out must be after check-in.");
        return;
      }
      if (checkIn < (minCheckIn || defaultCheckIn)) {
        setError("Check-in must be today or later.");
        return;
      }
      if (nights > 365) {
        setError("Maximum stay is 365 nights.");
        return;
      }
    }

    if (mode !== "booking" && !privacyPolicy) {
      setError("You must consent to the privacy policy to continue.");
      return;
    }

    setSaving(true);
    try {
      const body =
        mode === "booking"
          ? {
              propertyId,
              checkIn,
              checkOut,
              guests:  Number(guests),
              message: message.trim(),
              instantCheckout: isInstantPay,
            }
          : {
              propertyId,
              desiredMoveIn,
              occupants:       Number(occupants),
              monthlyIncome:   monthlyIncome ? Number(monthlyIncome) : undefined,
              employmentStatus,
              creditCheck,
              privacyPolicy,
              message: message.trim(),
            };

      const res     = await fetch(settings.endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error?.message || "Request failed");

      if (isInstantPay && payload.data?.checkoutUrl) {
        window.location.href = payload.data.checkoutUrl;
        return;
      }

      router.push(settings.redirect);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  // ── Rate availability flags (for button disabled state) ──
  const rateAvailable = {
    nightly:  nightlyRate  > 0,
    weekly:   weeklyRate   > 0 || nightlyRate > 0,
    monthly:  monthlyRate  > 0 || nightlyRate > 0,
    custom:   nightlyRate  > 0,   // custom uses nightly rate
  };


  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h1 className="text-3xl font-bold text-slate-900">{settings.title}</h1>

      {/* ════════════════════════════════════════
          BOOKING MODE  (mode === "booking")
      ════════════════════════════════════════ */}
      {mode === "booking" && (
        <>
          {/* ── Stay-type selector — SHORT_TERM_RENT only ── */}
          {showStayPicker && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Stay type
              </p>
              {/* Single flex row — never wraps */}
              <div className="flex w-full gap-2">
                {STAY_TYPES.map((t) => {
                  const available = rateAvailable[t.id];
                  const active    = stayType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      disabled={!available}
                      onClick={() => available && handleStayType(t.id)}
                      title={!available ? "Rate not set by host" : undefined}
                      className={[
                        // always flex row, centred, equal width
                        "flex flex-1 flex-row items-center justify-center gap-2",
                        "rounded-xl border-2 px-3 py-2.5",
                        "text-sm font-semibold whitespace-nowrap transition-all",
                        active
                          ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                          : available
                            ? "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50/40"
                            : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 opacity-50",
                      ].join(" ")}
                    >
                      <span className="text-base leading-none">{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Date pickers ── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block font-semibold text-slate-700">
              Check in
              <input
                name="checkIn"
                type="date"
                required
                min={minCheckIn}
                value={checkIn}
                onChange={handleCheckInChange}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block font-semibold text-slate-700">
              Check out
              <input
                name="checkOut"
                type="date"
                required
                min={minCheckOut}
                value={checkOut}
                readOnly={isCheckoutLocked}
                onChange={(e) => !isCheckoutLocked && setCheckOut(e.target.value)}
                className={`mt-2 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isCheckoutLocked
                    ? "border-slate-200 bg-slate-50 text-slate-500 cursor-default"
                    : "border-slate-300"
                }`}
              />
            </label>
          </div>

          {/* ── Nights badge ── */}
          {nights > 0 && (
            <p className="text-center text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                🌙 {nights} night{nights !== 1 ? "s" : ""}
              </span>
            </p>
          )}

          {/* ── Live price summary ── */}
          {nights > 0 && nightlyRate > 0 && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm space-y-1.5">
              <div className="flex justify-between text-slate-700">
                <span>
                  {currency} {Math.round(perNight).toLocaleString()} × {nights} night
                  {nights !== 1 ? "s" : ""}
                </span>
                <span className="font-bold text-slate-900">
                  {currency} {subtotal.toLocaleString()}
                </span>
              </div>

              {/* Savings badges */}
              {stayType === "weekly" && weeklyRate > 0 && nightlyRate > 0 && (
                <p className="text-xs font-medium text-emerald-600">
                  🏷️ Weekly rate applied — save vs paying nightly
                </p>
              )}
              {stayType === "monthly" && monthlyRate > 0 && nightlyRate > 0 && (
                <p className="text-xs font-medium text-emerald-600">
                  🏷️ Monthly rate applied — best value stay
                </p>
              )}

              <p className="text-xs text-slate-400">
                Final total confirmed at checkout after any fees &amp; taxes.
              </p>
            </div>
          )}

          {/* ── Guests ── */}
          <label className="block font-semibold text-slate-700">
            Guests
            <input
              name="guests"
              type="number"
              min="1"
              max="50"
              required
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </>
      )}

      {/* ════════════════════════════════════════
          RENTAL APPLICATION MODE  (mode !== "booking")
          No stay-type picker — applies to LONG_TERM_RENT
          and any other non-booking listing purposes.
      ════════════════════════════════════════ */}
      {mode !== "booking" && (
        <>
          <label className="block font-semibold text-slate-700">
            Desired move-in
            <input
              name="desiredMoveIn"
              type="date"
              required
              min={minCheckIn}
              value={desiredMoveIn}
              onChange={(e) => setDesiredMoveIn(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block font-semibold text-slate-700">
              Occupants
              <input
                name="occupants"
                type="number"
                min="1"
                max="30"
                required
                value={occupants}
                onChange={(e) => setOccupants(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block font-semibold text-slate-700">
              Monthly household income
              <input
                name="monthlyIncome"
                type="number"
                min="0"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="Optional"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <label className="block font-semibold text-slate-700">
            Employment status
            <input
              name="employmentStatus"
              maxLength="100"
              value={employmentStatus}
              onChange={(e) => setEmploymentStatus(e.target.value)}
              placeholder="e.g. Full-time employed"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="flex gap-3 text-sm text-slate-700 cursor-pointer">
            <input
              name="creditCheck"
              type="checkbox"
              checked={creditCheck}
              onChange={(e) => setCreditCheck(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded accent-blue-600"
            />
            I consent to a credit check if the owner requests one.
          </label>

          <label className="flex gap-3 text-sm text-slate-700 cursor-pointer">
            <input
              name="privacyPolicy"
              type="checkbox"
              required
              checked={privacyPolicy}
              onChange={(e) => setPrivacyPolicy(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded accent-blue-600"
            />
            I consent to processing this application under the privacy policy.
          </label>
        </>
      )}

      {/* ── Message (shared) ── */}
      <label className="block font-semibold text-slate-700">
        Message
        <textarea
          name="message"
          maxLength="2000"
          rows="4"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Introduce yourself and share any special requirements…"
          className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>

      {/* ── Error ── */}
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* ── Submit Buttons ── */}
      {mode === "booking" ? (
        <div className="space-y-3 pt-2">
          <button
            type="button"
            disabled={saving || nights < 1}
            onClick={(e) => handleSubmit(e, true)}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 font-bold text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 text-base"
          >
            <span>💳</span>
            {saving ? "Redirecting to Stripe Checkout…" : `Pay & Reserve Now (${currency} ${subtotal.toLocaleString()})`}
          </button>
          <button
            type="button"
            disabled={saving || nights < 1}
            onClick={(e) => handleSubmit(e, false)}
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 text-sm"
          >
            📩 Submit Booking Request to Host
          </button>
        </div>
      ) : (
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving || !privacyPolicy}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 font-bold text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 text-base"
          >
            <span>📩</span>
            {saving ? "Submitting Application…" : "Submit Rental Application"}
          </button>
        </div>
      )}
    </form>
  );
}
