"use client";

import { useEffect } from "react";

export default function RecentlyViewedRecorder({ propertyId }) {
  useEffect(() => {
    if (!propertyId) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch("/api/recently-viewed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
        signal: controller.signal,
      }).catch((err) => {
        // Silently catch AbortError when component unmounts or property changes
        if (err.name !== "AbortError") {
          console.error("RecentlyViewedRecorder error:", err);
        }
      });
    }, 750);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [propertyId]);

  return null;
}
