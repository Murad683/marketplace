// src/pages/ProductListPage.jsx
import { useEffect, useMemo, useState } from "react";
import { getProducts, getCategories } from "../api";
import ProductCard from "../components/ProductCard";

export default function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Controls
  const [q, setQ] = useState("");
  const [catId, setCatId] = useState("");
  const [sort, setSort] = useState("newest"); // newest|priceAsc|priceDesc|stock

  useEffect(() => {
    setLoading(true);
    Promise.all([getProducts(), getCategories().catch(() => [])])
      .then(([ps, cs]) => {
        setProducts(ps || []);
        setCats(cs || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // “New” window: 1 day
  const NEW_WINDOW_MS = 24 * 60 * 60 * 1000;

  const newIdSet = useMemo(() => {
    const set = new Set();
    const now = Date.now();
    (products || []).forEach((p) => {
      if (p?.createdAt) {
        const ts = Date.parse(
          typeof p.createdAt === "string" && p.createdAt.includes(" ") && !p.createdAt.includes("T")
            ? p.createdAt.replace(" ", "T")
            : p.createdAt
        );
        if (!Number.isNaN(ts) && now - ts <= NEW_WINDOW_MS) set.add(p.id);
      }
    });
    return set;
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];

    // search
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(t) ||
          p.details?.toLowerCase().includes(t) ||
          p.categoryName?.toLowerCase().includes(t)
      );
    }

    // category
    if (catId) {
      list = list.filter((p) => String(p.categoryId) === String(catId));
    }

    // sort
    switch (sort) {
      case "priceAsc":
        list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "priceDesc":
        list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "stock":
        list.sort((a, b) => (b.stockCount ?? 0) - (a.stockCount ?? 0));
        break;
      default: {
        // newest by createdAt (fallback: by id desc)
        const hasCreatedAt = list.some((p) => p?.createdAt);
        if (hasCreatedAt) {
          list.sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
          );
        } else {
          list.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        }
        break;
      }
    }
    return list;
  }, [products, q, catId, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">All Products</h1>
          <p className="text-sm section-meta">
            Filter, sort and browse the catalog
          </p>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="field h-10 text-sm"
          />

          <select
            value={catId}
            onChange={(e) => setCatId(e.target.value)}
            aria-label="Filter by category"
            className="field h-10 text-sm"
          >
            <option value="">All categories</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort products"
            className="field h-10 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="priceAsc">Price ↑</option>
            <option value="priceDesc">Price ↓</option>
            <option value="stock">Stock</option>
          </select>
        </div>
      </div>

      {/* Count chip */}
      {!loading && (
        <div
          className="mb-4 inline-flex items-center gap-2 chip"
          aria-live="polite"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)]" />
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Grid / Empty / Skeleton */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]"
              role="status"
              aria-label="Loading product"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-card)] p-10 text-center section-meta"
          role="note"
          aria-label="No products message"
        >
          No products match your filters.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <div key={p.id} className="transition-transform hover:-translate-y-0.5">
              <ProductCard product={p} size="md" isNew={newIdSet.has(p.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
