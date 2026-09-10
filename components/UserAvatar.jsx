"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import profileDefault from "@/assets/images/profile.png";
import { getHighResProfileImage } from "@/utils/avatar";

function getInitials(name) {
  if (!name || name === "User") return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

/** Renders a coloured circle with initials — works fully offline, no external requests. */
function InitialsAvatar({ name, className }) {
  const initials = getInitials(name);
  return (
    <span
      aria-label={name || "User"}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
        color: "#fff",
        fontWeight: 700,
        fontSize: "clamp(0.6rem, 2vw, 1rem)",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
}

export default function UserAvatar({
  src,
  alt = "User profile picture",
  className = "h-9 w-9 rounded-full object-cover",
  width = 72,
  height = 72,
  priority = false,
}) {
  const [imgSrc, setImgSrc] = useState(() => getHighResProfileImage(src) || null);
  const [imgError, setImgError] = useState(false);
  const [fetchedSrc, setFetchedSrc] = useState(null);
  const [fetchDone, setFetchDone] = useState(false);

  // Reset when the src prop changes (e.g. after upload)
  useEffect(() => {
    const resolved = getHighResProfileImage(src) || null;
    setImgSrc(resolved);
    setImgError(false);
    setFetchedSrc(null);
    setFetchDone(!!resolved);
  }, [src]);

  // If no image from session, silently try to fetch from the profile API
  useEffect(() => {
    if (imgSrc || fetchDone) return;

    let cancelled = false;
    const controller = new AbortController();

    async function fetchProfileImage() {
      try {
        const res = await fetch("/api/user/profile", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok || cancelled) return;
        const payload = await res.json();
        const apiImage = payload?.data?.user?.image;
        if (apiImage && !cancelled) {
          setFetchedSrc(getHighResProfileImage(apiImage) || apiImage);
        }
      } catch {
        // silently ignore network/timeout errors — initials will show
      } finally {
        if (!cancelled) setFetchDone(true);
      }
    }

    fetchProfileImage();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [imgSrc, fetchDone]);

  const activeSrc = imgSrc || fetchedSrc;
  const showImage = activeSrc && !imgError;
  const isExternal =
    typeof activeSrc === "string" &&
    (activeSrc.startsWith("http://") ||
      activeSrc.startsWith("https://") ||
      activeSrc.startsWith("data:"));

  if (showImage) {
    return (
      <Image
        className={className}
        src={activeSrc}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        unoptimized={isExternal}
        onError={() => setImgError(true)}
      />
    );
  }

  // Fully offline fallback — CSS-rendered coloured circle with initials
  return <InitialsAvatar name={alt} className={className} />;
}
