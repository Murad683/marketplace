// src/pages/WishlistPage.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { getWishlist, removeFromWishlist, productPhotoUrl } from "../api";
import { Link } from "react-router-dom";

export default function WishlistPage() {
  const { auth, isCustomer } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getWishlist(auth);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isCustomer) load();
  }, [isCustomer]);

  const onRemove = async (pid) => {
    try {
      await removeFromWishlist(pid, auth);
      await load();
    } catch (e) {
      alert("Remove failed: " + e.message);
    }
  };

  if (!isCustomer) {
    return (
      <div className="token-card max-w-md mx-auto mt-10 text-center p-8 section-meta">
        Only customers can view wishlist.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">My Wishlist</h1>

      {loading ? (
        <div className="section-meta">Loading...</div>
      ) : items.length === 0 ? (
        <div className="section-meta">No items in wishlist.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {items.map((p) => {
            const img =
              p.photoIds && p.photoIds.length > 0
                ? productPhotoUrl(p.id, p.photoIds[0])
                : null;

            return (
              <div
                key={p.id}
                className="token-card overflow-hidden"
              >
                <Link to={`/product/${p.id}`} className="block">
                  <div className="w-full h-36 bg-[var(--bg-tertiary)] flex items-center justify-center">
                    {img ? (
                      <img
                        src={img}
                        alt={p.name}
                        className="object-contain w-full h-full"
                      />
                    ) : (
                      <div className="section-meta text-sm">No image</div>
                    )}
                  </div>
                </Link>

                <div className="p-3">
                  <div className="text-xs section-meta mb-1">{p.categoryName}</div>
                  <Link
                    to={`/product/${p.id}`}
                    className="block font-medium line-clamp-2"
                  >
                    {p.name}
                  </Link>
                  <div className="font-semibold mt-1">${p.price}</div>

                  <div className="flex items-center gap-2 mt-3">
                    <Link
                      to={`/product/${p.id}`}
                      className="flex-1 text-center text-sm btn btn-primary py-2"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => onRemove(p.id)}
                      className="btn btn-secondary text-sm px-3 py-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
