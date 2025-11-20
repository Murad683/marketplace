import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProducts } from "../api";
import ProductCard from "../components/ProductCard";

export default function MerchantProductsPage() {
  const { id } = useParams();
  const merchantId = String(id || "");
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    setLoading(true);
    getProducts()
      .then((res) => setAllProducts(res || []))
      .finally(() => setLoading(false));
  }, []);

  const list = useMemo(() => {
    let filtered = (allProducts || []).filter(
      (p) => String(p.merchantId) === merchantId
    );
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(t) ||
          p.details?.toLowerCase().includes(t) ||
          p.categoryName?.toLowerCase().includes(t)
      );
    }
    switch (sort) {
      case "priceAsc":
        filtered.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "priceDesc":
        filtered.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "stock":
        filtered.sort((a, b) => (b.stockCount ?? 0) - (a.stockCount ?? 0));
        break;
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
    }
    return filtered;
  }, [allProducts, merchantId, q, sort]);

  const merchantName = list[0]?.merchantCompanyName || "Merchant";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{merchantName}</h1>
          <p className="text-sm section-meta">All listings by this merchant</p>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search this merchant…"
            className="field h-10 text-sm"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="field h-10 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="priceAsc">Price ↑</option>
            <option value="priceDesc">Price ↓</option>
            <option value="stock">Stock</option>
          </select>
          <Link
            to="/"
            className="h-10 inline-flex items-center justify-center btn btn-secondary text-sm"
          >
            ← Back to all
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]"
            />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-card)] p-10 text-center section-meta">
          This merchant has no active listings.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <div key={p.id} className="transition-transform hover:-translate-y-0.5">
              <ProductCard product={p} size="md" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
