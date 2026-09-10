"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    void fetch("/api/client-errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error?.message,
        digest: error?.digest,
        path: window.location.pathname,
      }),
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <main className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
            PropertyPulse
          </p>
          <h1 className="mt-3 text-3xl font-bold">Something went wrong</h1>
          <p className="mt-3 text-slate-300">
            The issue was recorded safely. You can retry without submitting the form twice.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
