"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FaCalendarAlt, FaClock, FaVideo, FaUserFriends, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00"
];

export default function ViewingRequestForm({ propertyId, propertyName }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // States for calendar & slots
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [viewingType, setViewingType] = useState("IN_PERSON");
  const [duration, setDuration] = useState("30");
  const [message, setMessage] = useState("");

  // Get tomorrow's date format (YYYY-MM-DD) for min date attribute
  const tomorrowStr = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split("T")[0];
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (!selectedDate || !selectedTimeSlot) {
      setError("Please select both a date and a time slot.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Combine date and time slot
      const [hours, minutes] = selectedTimeSlot.split(":");
      const localDate = new Date(selectedDate);
      localDate.setHours(parseInt(hours, 10));
      localDate.setMinutes(parseInt(minutes, 10));

      const response = await fetch("/api/viewings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          scheduledStart: localDate.toISOString(),
          durationMinutes: Number(duration),
          type: viewingType,
          message: message,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Viewing request failed");
      
      setSuccess(true);
      setTimeout(() => router.push("/viewings"), 1500);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-8 text-center shadow-md backdrop-blur-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl">
          <FaCheckCircle />
        </div>
        <h2 className="text-xl font-bold text-emerald-950">Request Sent Successfully!</h2>
        <p className="mt-2 text-sm text-emerald-700">
          The property manager has been notified. Redirecting you to your viewings dashboard...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Schedule a viewing</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950 truncate" title={propertyName}>
          {propertyName}
        </h1>
      </div>

      {/* Step 1: Select Date */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
          <FaCalendarAlt className="text-blue-600" />
          1. Select a Date
        </label>
        <input
          type="date"
          required
          min={tomorrowStr}
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setSelectedTimeSlot(""); // Reset slot when date changes
          }}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-900 font-medium"
        />
      </div>

      {/* Step 2: Time Slots Grid (visible only after selecting a date) */}
      {selectedDate && (
        <div className="space-y-3 animate-fadeIn duration-200">
          <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
            <FaClock className="text-blue-600" />
            2. Choose Time Slot
          </label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {TIME_SLOTS.map((slot) => {
              const active = selectedTimeSlot === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedTimeSlot(slot)}
                  className={`rounded-xl py-2.5 text-center text-xs font-bold border-2 transition-all ${
                    active
                      ? "border-blue-600 bg-blue-600 text-white shadow-md"
                      : "border-slate-100 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Type & Duration */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-800">
            Viewing Type
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewingType("IN_PERSON")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition-all ${
                viewingType === "IN_PERSON"
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <FaUserFriends /> In Person
            </button>
            <button
              type="button"
              onClick={() => setViewingType("VIRTUAL")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition-all ${
                viewingType === "VIRTUAL"
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <FaVideo /> Virtual
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-800">
            Preferred Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-semibold text-slate-700"
          >
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">1 hour</option>
          </select>
        </div>
      </div>

      {/* Step 4: Message */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-800">
          Message to Landlord/Agent
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1000}
          rows={3}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-slate-800"
          placeholder="Let them know what you are looking for, or if you have specific accessibility requirements."
        />
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-800">
          <FaExclamationTriangle className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        disabled={loading || !selectedDate || !selectedTimeSlot}
        className="w-full rounded-xl bg-blue-600 px-6 py-4 font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Scheduling request…" : "Request Viewing"}
      </button>
    </form>
  );
}
