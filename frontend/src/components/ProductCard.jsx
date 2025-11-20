// src/components/ProductCard.jsx
import { Link } from "react-router-dom";
import { productPhotoUrl } from "../api";

export default function ProductCard({ product, size = "md", isNew }) {
  const firstId =
    product?.photoIds && product.photoIds.length > 0 ? product.photoIds[0] : null;

  const sizeMap = {
    sm: { aspect: "aspect-[4/3]", bodyMinH: "min-h-[110px]" },
    md: { aspect: "aspect-[4/3]", bodyMinH: "min-h-[120px]" },
    lg: { aspect: "aspect-[16/10]", bodyMinH: "min-h-[140px]" },
  };
  const S = sizeMap[size] || sizeMap.md;

  const lowStock = (product?.stockCount ?? 0) > 0 && product.stockCount <= 5;

  const computedIsNew = (() => {
    if (typeof isNew === "boolean") return isNew;
    const raw = product?.createdAt;
    if (!raw) return false;
    const ts = Date.parse(
      typeof raw === "string" && raw.includes(" ") && !raw.includes("T")
        ? raw.replace(" ", "T")
        : raw
    );
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts < 24 * 60 * 60 * 1000;
  })();

  // ➕ format YYYY-MM-DD (il-ay-gün)
  const createdDateStr = (() => {
    const raw = product?.createdAt;
    if (!raw) return "";
    const ts = Date.parse(
      typeof raw === "string" && raw.includes(" ") && !raw.includes("T")
        ? raw.replace(" ", "T")
        : raw
    );
    if (Number.isNaN(ts)) return "";
    const d = new Date(ts);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  return (
    <article aria-label={product?.name} className="token-card h-full overflow-hidden flex flex-col">
      {/* IMAGE (clickable) */}
      <Link
        to={`/product/${product?.id}`}
        aria-label={`Open ${product?.name}`}
        className="relative block"
      >
        <div className={`${S.aspect} w-full overflow-hidden`}>
          {firstId ? (
            <img
              src={productPhotoUrl(product.id, firstId)}
              alt={product?.name || "Product image"}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm section-meta">
              No image
            </div>
          )}
        </div>

        {/* badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex gap-2">
          {computedIsNew && <span className="status-pill" data-tone="progress">New</span>}
          {lowStock && <span className="status-pill" data-tone="danger">Low stock</span>}
        </div>
      </Link>

      {/* BODY */}
      <div className={`flex flex-1 flex-col gap-3 px-4 pb-4 pt-3 ${S.bodyMinH}`}>
        <div className="text-[12px] section-meta uppercase tracking-wide">
          {product?.categoryName}
        </div>
        <h3 className="line-clamp-1 text-lg font-semibold" title={product?.name}>
          {product?.name}
        </h3>

        <p className="line-clamp-2 text-[13px] leading-5 section-meta">
          {product?.details}
        </p>

        {/* Added date */}
        {createdDateStr && (
          <div className="flex items-center gap-2 text-[12px] section-meta">
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M6 2a1 1 0 100 2h8a1 1 0 100-2H6zM4 6a2 2 0 00-2 2v6a4 4 0 004 4h8a4 4 0 004-4V8a2 2 0 00-2-2H4zm1 3h10v7a2 2 0 01-2 2H7a2 2 0 01-2-2V9z" />
            </svg>
            <span>Added: {createdDateStr}</span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between">
          <div className="text-lg font-semibold">${Number(product?.price ?? 0).toFixed(2)}</div>

          <Link
            to={`/product/${product?.id}`}
            className="btn btn-secondary text-sm"
            aria-label={`View details of ${product?.name}`}
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
