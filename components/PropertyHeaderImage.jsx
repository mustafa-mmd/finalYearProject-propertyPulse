"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { FaTimes, FaChevronLeft, FaChevronRight, FaImages } from "react-icons/fa";
import { formatPropertyImage } from "@/utils/imageHelper";

/* ─────────────────────────────────────────────
   Inline Lightbox
───────────────────────────────────────────── */
function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const total = images.length;

  const prev = useCallback(
    (e) => { e.stopPropagation(); setIdx((i) => (i - 1 + total) % total); },
    [total]
  );
  const next = useCallback(
    (e) => { e.stopPropagation(); setIdx((i) => (i + 1) % total); },
    [total]
  );

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
        aria-label="Close gallery"
      >
        <FaTimes />
      </button>

      {/* Counter */}
      <p className="absolute left-1/2 top-5 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1 text-sm font-semibold text-white backdrop-blur-sm">
        {idx + 1} / {total}
      </p>

      {/* Prev */}
      {total > 1 && (
        <button
          onClick={prev}
          className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
          aria-label="Previous photo"
        >
          <FaChevronLeft size={20} />
        </button>
      )}

      {/* Image */}
      <div
        className="relative mx-16 h-[80vh] w-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[idx]}
          alt={`Photo ${idx + 1}`}
          fill
          priority
          unoptimized={images[idx].startsWith("http")}
          className="object-contain"
          sizes="100vw"
        />
      </div>

      {/* Next */}
      {total > 1 && (
        <button
          onClick={next}
          className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
          aria-label="Next photo"
        >
          <FaChevronRight size={20} />
        </button>
      )}

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2 overflow-x-auto px-4 pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIdx(i); }}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === idx ? "border-white" : "border-transparent opacity-60 hover:opacity-90"
              }`}
              aria-label={`View photo ${i + 1}`}
            >
              <Image
                src={src}
                alt={`Thumb ${i + 1}`}
                fill
                unoptimized={src.startsWith("http")}
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Hero Gallery
───────────────────────────────────────────── */
export default function PropertyHeaderImage({ images = [], image, property }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);

  // Support old single-image API for backwards-compat
  const rawList = images.length ? images : image ? [image] : [];
  const formatted = rawList.map(formatPropertyImage).filter(Boolean);

  if (!formatted.length) {
    return (
      <div className="flex h-[420px] w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-6xl">
        🏠
      </div>
    );
  }

  const openLightbox = (idx) => setLightboxIdx(idx);
  const closeLightbox = () => setLightboxIdx(null);

  const cover = formatted[0];
  // Show up to 4 thumbnails beside the cover (indices 1–4)
  const thumbs = formatted.slice(1, 5);
  const remaining = formatted.length - 5; // hidden count (> 5 images)

  return (
    <>
      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          images={formatted}
          startIndex={lightboxIdx}
          onClose={closeLightbox}
        />
      )}

      <section className="w-full overflow-hidden bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div
            className={`grid gap-2 rounded-2xl overflow-hidden ${
              thumbs.length === 0
                ? "grid-cols-1"
                : thumbs.length <= 2
                ? "grid-cols-[1.8fr_1fr]"
                : "grid-cols-[1.8fr_1fr]"
            }`}
            style={{ height: "480px" }}
          >
            {/* ── Main cover image ── */}
            <div
              className="relative cursor-pointer overflow-hidden"
              onClick={() => openLightbox(0)}
            >
              <Image
                src={cover}
                alt={property?.name || "Property photo"}
                fill
                priority
                unoptimized={cover.startsWith("http")}
                className="object-cover transition duration-500 hover:scale-105"
                sizes="(max-width: 768px) 100vw, 65vw"
              />
              {/* Gradient overlay with name */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              {property?.name && (
                <div className="absolute bottom-0 left-0 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
                    {property.listingPurpose?.replaceAll("_", " ") || "Property"}
                  </p>
                  <h1 className="mt-1 text-2xl font-bold text-white drop-shadow-lg leading-tight max-w-md">
                    {property.name}
                  </h1>
                </div>
              )}
              {/* Tap hint */}
              <div className="absolute right-3 top-3 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                Click to enlarge
              </div>
            </div>

            {/* ── Thumbnail grid ── */}
            {thumbs.length > 0 && (
              <div
                className={`grid gap-2 ${
                  thumbs.length === 1
                    ? "grid-rows-1"
                    : thumbs.length === 2
                    ? "grid-rows-2"
                    : thumbs.length === 3
                    ? "grid-rows-3"
                    : "grid-rows-2 grid-cols-2"
                }`}
              >
                {thumbs.map((src, i) => {
                  const isLast = i === thumbs.length - 1 && remaining > 0;
                  const globalIdx = i + 1;
                  return (
                    <div
                      key={i}
                      className="relative cursor-pointer overflow-hidden"
                      onClick={() => openLightbox(isLast ? null : globalIdx)}
                    >
                      <Image
                        src={src}
                        alt={`Property photo ${globalIdx + 1}`}
                        fill
                        unoptimized={src.startsWith("http")}
                        className="object-cover transition duration-300 hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      {/* "Show all photos" overlay on last thumb */}
                      {isLast && (
                        <button
                          onClick={(e) => { e.stopPropagation(); openLightbox(globalIdx); }}
                          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 backdrop-blur-[1px] text-white transition hover:bg-black/65"
                          aria-label={`Show all ${formatted.length} photos`}
                        >
                          <FaImages size={24} />
                          <span className="text-sm font-bold">
                            +{remaining + 1} more
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Show all photos button */}
          {formatted.length > 1 && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => openLightbox(0)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <FaImages />
                Show all {formatted.length} photos
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
