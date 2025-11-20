import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { getCart, deleteCartItem, createOrders } from "../api";

export default function CartPage() {
  const { auth, isCustomer } = useAuth();
  const [items, setItems] = useState([]);

  const load = () => {
    getCart(auth)
      .then(setItems)
      .catch(() => setItems([]));
  };

  useEffect(() => {
    if (isCustomer) load();
  }, [isCustomer]);

  const total = useMemo(
    () => items.reduce((sum, it) => sum + (it.totalPrice || 0), 0),
    [items]
  );

  const handleDelete = async (itemId) => {
    await deleteCartItem(itemId, auth);
    load();
  };

  const handleCheckout = async () => {
    try {
      await createOrders(auth);
      alert("Checkout successful!");
      load();
    } catch (err) {
      alert("Checkout failed: " + err.message);
    }
  };

  if (!isCustomer) {
    return (
      <div className="token-card max-w-md mx-auto mt-10 text-center p-8 section-meta">
        Only customers can view cart.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My Cart</h1>
        <div className="text-sm section-meta">{items.length} items</div>
      </div>

      <div className="token-card overflow-hidden">
        {items.length === 0 ? (
          <div className="p-8 section-meta text-center">Cart is empty.</div>
        ) : (
          <ul className="order-list">
            {items.map((it) => (
              <li
                key={it.itemId}
                className="flex items-start justify-between gap-4 p-4"
              >
                <div>
                  <div className="font-medium">
                    {it.productName}
                  </div>
                  <div className="text-sm section-meta">
                    Count: {it.count}
                  </div>
                  <div className="text-sm section-meta">
                    Unit: ${it.pricePerUnit}
                  </div>
                  <div className="text-sm font-semibold">
                    Total: ${it.totalPrice}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(it.itemId)}
                  className="btn btn-secondary text-sm"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between p-4 border-t border-[var(--divider)] section-head rounded-b-[inherit]">
          <div className="text-lg font-semibold">
            Grand Total: ${total}
          </div>

          <button
            disabled={items.length === 0}
            onClick={handleCheckout}
            className="btn btn-primary text-sm"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
