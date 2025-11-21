import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getProductById,
  addToCart,
  addToWishlist,
  removeFromWishlist,
} from "../api";
import { BASE_URL } from "../api";
import { useAuth } from "../hooks/useAuth";
import ImageGallery from "../components/ImageGallery";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth, isCustomer, isMerchant } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [wishLoading, setWishLoading] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const data = await getProductById(id);
        setProduct(data);
        setQuantity(1);
        setIsInWishlist(false);
      } catch (e) {
        console.error(e);
        setErrorMsg("Failed to load product.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleAddToCart() {
    if (!product) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const maxStock = product.stockCount ?? 0;
      if (maxStock === 0) {
        setErrorMsg("Out of stock.");
        return;
      }
      if (quantity < 1) {
        setErrorMsg("Quantity must be at least 1.");
        return;
      }
      if (quantity > maxStock) {
        setErrorMsg("Not enough stock for that quantity.");
        return;
      }
      await addToCart(product.id, quantity, auth);
      setSuccessMsg("Added to cart ✅");
    } catch (err) {
      console.error(err);
      setErrorMsg("Couldn't add to cart: " + err.message);
    }
  }

  async function handleWishlistToggle() {
    if (!product || !isCustomer) return;
    setWishLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (isInWishlist) {
        await removeFromWishlist(product.id, auth);
        setIsInWishlist(false);
        setSuccessMsg("Removed from wishlist ❌");
      } else {
        await addToWishlist(product.id, auth);
        setIsInWishlist(true);
        setSuccessMsg("Added to wishlist ❤️");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Wishlist action failed: " + err.message);
    } finally {
      setWishLoading(false);
    }
  }

  if (loading) {
    return <div className="max-w-5xl mx-auto p-6">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-red-600">
        Could not find product.
      </div>
    );
  }

  // Added on: YYYY-MM-DD
  const addedStr = (() => {
    const raw = product.createdAt;
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
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="text-sm muted inline-flex items-center gap-1 hover:underline"
      >
        ← Back
      </button>

      <div className="token-card p-6 lg:p-8 grid md:grid-cols-2 gap-6 lg:gap-8">
        {/* LEFT: images */}
        <div>
          <ImageGallery photoUrls={product.photoUrls || []} />
        </div>

        {/* RIGHT: info */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="chip uppercase tracking-wide text-[11px]">
              {product.categoryName}
            </div>
            {addedStr && (
              <div className="chip text-[11px]">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                  <path d="M6 2a1 1 0 100 2h8a1 1 0 100-2H6zM4 6a2 2 0 00-2 2v6a4 4 0 004 4h8a4 4 0 004-4V8a2 2 0 00-2-2H4zm1 3h10v7a2 2 0 01-2 2H7a2 2 0 01-2-2V9z" />
                </svg>
                Added: {addedStr}
              </div>
            )}
          </div>

          <h1 className="text-2xl font-semibold leading-tight">{product.name}</h1>

          <div className="text-sm leading-relaxed section-meta">
            {product.details}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-3xl font-semibold">${product.price}</div>
            <div className="text-sm section-meta">
              Stock:{" "}
              <span className="font-semibold">
                {product.stockCount > 0
                  ? `${product.stockCount} available`
                  : "Out of stock"}
              </span>
            </div>
          </div>

          {/* 👉 CLICKABLE MERCHANT */}
          <div className="text-sm section-meta">
            Sold by{" "}
            <Link
              to={`/merchant/${product.merchantId}`}
              className="font-semibold hover:underline"
              aria-label={`View all products by ${product.merchantCompanyName}`}
            >
              {product.merchantCompanyName}
            </Link>
          </div>

          {/** CUSTOMER actions */}
          {isCustomer && (
            <div className="space-y-4">
              <div>
                <div className="text-xs section-meta mb-2 font-medium">
                  Quantity
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="btn btn-secondary px-3 py-2"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <div className="min-w-[3rem] text-center font-semibold">
                    {quantity}
                  </div>
                  <button
                    className="btn btn-secondary px-3 py-2"
                    onClick={() =>
                      setQuantity((q) =>
                        Math.min(product.stockCount ?? 1, q + 1)
                      )
                    }
                    disabled={quantity >= (product.stockCount ?? 1)}
                  >
                    +
                  </button>
                  <div className="text-xs section-meta">
                    In stock: {product.stockCount}
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary w-full"
                disabled={(product.stockCount ?? 0) === 0 || quantity < 1}
                onClick={handleAddToCart}
              >
                Add to Cart
              </button>

              <button
                className="btn btn-secondary w-full"
                disabled={wishLoading}
                onClick={handleWishlistToggle}
              >
                {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist ❤️"}
              </button>
            </div>
          )}

          {isMerchant && (
            <div>
              <Link
                to={`/merchant/edit-product/${product.id}`}
                className="btn btn-primary"
              >
                Edit Product
              </Link>
            </div>
          )}

          {errorMsg && <div className="text-red-600 text-sm">{errorMsg}</div>}
          {successMsg && (
            <div className="text-emerald-600 text-sm">{successMsg}</div>
          )}
        </div>
      </div>
    </div>
  );
}
