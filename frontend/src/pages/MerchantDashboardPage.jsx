import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function MerchantDashboardPage() {
  const { isMerchant } = useAuth();

  if (!isMerchant) {
    return (
      <div className="token-card max-w-md mx-auto mt-10 text-center p-8 section-meta">
        Only merchants can view this page.
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        Merchant Dashboard
      </h1>

      <div className="token-card divide-y divide-[var(--divider)]">
        <Link
          to="/merchant/create-product"
          className="block p-5 transition-colors hover:bg-[var(--bg-tertiary)]"
        >
          <div className="font-medium">Create Product</div>
          <div className="text-sm section-meta">
            Add a new product to the marketplace and upload photos.
          </div>
        </Link>

        <Link
          to="/merchant/orders"
          className="block p-5 transition-colors hover:bg-[var(--bg-tertiary)]"
        >
          <div className="font-medium">View Orders</div>
          <div className="text-sm section-meta">
            See and update incoming orders for your products.
          </div>
        </Link>
      </div>
    </div>
  );
}
