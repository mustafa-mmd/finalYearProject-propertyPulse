"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SupportTicketForm() {
  const router = useRouter();
  const [state, setState] = useState({ busy: false, error: "", success: "" });

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget; // Capture form element synchronously before async boundary
    
    setState({ busy: true, error: "", success: "" });
    try {
      const response = await fetch("/api/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const payload = await response.json();
      
      if (!response.ok) {
        return setState({
          busy: false,
          error: payload.error?.message || "Could not create ticket",
          success: "",
        });
      }
      
      form.reset(); // Safe reset using the captured element reference
      setState({
        busy: false,
        error: "",
        success: `Ticket ${payload.data.reference} created.`,
      });
      router.refresh();
    } catch (err) {
      setState({
        busy: false,
        error: err.message || "An unexpected error occurred",
        success: "",
      });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-white p-6">
      <h2 className="text-xl font-bold text-slate-900">Contact support</h2>
      <select name="category" className="w-full rounded-xl border px-4 py-3">
        <option value="ACCOUNT">Account</option>
        <option value="LISTING">Listing</option>
        <option value="PAYMENT">Payment</option>
        <option value="BOOKING">Booking</option>
        <option value="RENTAL">Rental</option>
        <option value="SALE">Sale</option>
        <option value="SAFETY">Safety</option>
        <option value="TECHNICAL">Technical</option>
        <option value="OTHER">Other</option>
      </select>
      <input
        name="subject"
        required
        minLength={5}
        maxLength={160}
        placeholder="Subject"
        className="w-full rounded-xl border px-4 py-3"
      />
      <textarea
        name="description"
        required
        minLength={10}
        maxLength={5000}
        rows={5}
        placeholder="How can we help?"
        className="w-full rounded-xl border px-4 py-3 resize-none"
      />
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-700">{state.success}</p>}
      <button
        type="submit"
        disabled={state.busy}
        className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {state.busy ? "Sending…" : "Create ticket"}
      </button>
    </form>
  );
}
