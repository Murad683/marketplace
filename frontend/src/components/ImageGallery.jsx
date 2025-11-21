import { useEffect, useState, useCallback } from "react";
import { BASE_URL } from "../api";
export default function ImageGallery({ photoUrls = [] }) {
  const [idx, setIdx] = useState(0);

  const hasImages = photoUrls.length > 0;

  const resolvePhoto = (src) => {
    if (!src) return "";
    if (src.startsWith("http")) return src;
    const cleaned = src.replace(/^\/?uploads\//, "");
    return `${BASE_URL}/uploads/${cleaned}`;
  };

  const next = useCallback(
    () => setIdx((i) => (i + 1) % Math.max(photoUrls.length, 1)),
    [photoUrls.length]
  );
  const prev = useCallback(
    () => setIdx((i) => (i - 1 + Math.max(photoUrls.length, 1)) % Math.max(photoUrls.length, 1)),
    [photoUrls.length]
  );

  // Klaviatura oxları
  useEffect(() => {
    function onKey(e) {
      if (!hasImages) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasImages, next, prev]);

  if (!hasImages) {
    return (
      <div className="w-full h-80 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] flex items-center justify-center section-meta">
        No image
      </div>
    );
  }

  const mainSrc = resolvePhoto(photoUrls[idx]);

  return (
    <div className="space-y-3">
      {/* Main image + arrows */}
      <div className="relative token-card p-2">
        <img
          src={mainSrc}
          alt="product"
          className="w-full h-80 object-cover rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-card)]"
        />

        {/* Left arrow */}
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 btn btn-secondary px-2 py-1 text-sm"
          aria-label="Previous image"
        >
          ‹
        </button>

        {/* Right arrow */}
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-secondary px-2 py-1 text-sm"
          aria-label="Next image"
        >
          ›
        </button>
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-4 gap-3">
        {photoUrls.map((src, i) => {
          const active = i === idx;
          const resolved = resolvePhoto(src);
          return (
            <button
              key={`${src}-${i}`}
              onClick={() => setIdx(i)}
              className="relative rounded-[var(--radius-sm)] overflow-hidden border border-[var(--border-subtle)]"
              style={{
                boxShadow: active ? "0 0 0 3px var(--accent-soft)" : "none",
              }}
            >
              <img
                src={resolved}
                alt={`thumb-${i}`}
                className="w-full h-20 object-cover"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
