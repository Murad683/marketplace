// src/pages/OrdersPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { getOrders, createOrders, cancelOrder } from "../api";

const COMPLETED_STATUSES = new Set([
  "DELIVERED",
  "REJECT_BY_CUSTOMER",
  "REJECT_BY_MERCHANT",
]);

export default function OrdersPage() {
  const { auth, isCustomer } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  // UI states: reason text + “expanded” (input açıq?) per order
  const [reasons, setReasons] = useState({});     // { [orderId]: string }
  const [expanded, setExpanded] = useState({});   // { [orderId]: boolean }
  const [sortBy, setSortBy] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const load = () => {
    setLoading(true);
    getOrders(auth)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isCustomer) load();
  }, [isCustomer]);

  const handleCheckout = async () => {
    try {
      await createOrders(auth);
      load();
      alert("Checkout successful, orders created!");
    } catch (err) {
      if (err.code === "NO_BALANCE") {
        alert("You have no balance to continue order");
        return;
      }
      if (err.code === "INSUFFICIENT_BALANCE") {
        alert("Your balance is not enough to cover this order");
        return;
      }
      alert("Checkout failed: " + err.message);
    }
  };

  const openCancel = (orderId) =>
    setExpanded((s) => ({ ...s, [orderId]: true }));

  const closeCancel = (orderId) =>
    setExpanded((s) => ({ ...s, [orderId]: false }));

  const onCancel = async (orderId) => {
    const reason = (reasons[orderId] || "").trim();
    if (!reason) {
      alert("Please write a reason to cancel.");
      return;
    }
    try {
      await cancelOrder(orderId, reason, auth);
      setReasons((r) => ({ ...r, [orderId]: "" }));
      closeCancel(orderId);
      load();
      alert("Order cancelled.");
    } catch (err) {
      alert("Cancel failed: " + err.message);
    }
  };

  const filteredAndSorted = useMemo(() => {
    let list = orders;
    if (statusFilter !== "ALL") {
      list = list.filter((o) => o.status === statusFilter);
    }

    const cmpDateDesc = (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

    const cmpDateAsc = (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

    const cmpTotal = (dir) => (a, b) =>
      (dir === "desc" ? b.totalAmount : a.totalAmount) -
      (dir === "desc" ? a.totalAmount : b.totalAmount);

    const listCopy = [...list];
    switch (sortBy) {
      case "oldest":
        listCopy.sort(cmpDateAsc);
        break;
      case "amount_desc":
        listCopy.sort(cmpTotal("desc"));
        break;
      case "amount_asc":
        listCopy.sort(cmpTotal("asc"));
        break;
      case "newest":
      default:
        listCopy.sort(cmpDateDesc);
        break;
    }
    return listCopy;
  }, [orders, sortBy, statusFilter]);

  const activeOrders = filteredAndSorted.filter(
    (o) => !COMPLETED_STATUSES.has(o.status)
  );
  const historyOrders = filteredAndSorted.filter((o) =>
    COMPLETED_STATUSES.has(o.status)
  );

  if (!isCustomer) {
    return (
      <div className="token-card max-w-md mx-auto mt-10 text-center p-8 section-meta">
        Only customers can view orders.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            My Orders
          </h1>
          <p className="text-sm section-meta">Orders created from your cart</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs section-meta">Filter</label>
            <select
              className="field text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="CREATED">Created</option>
              <option value="PAID_FROM_BALANCE">Paid from balance</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="DELIVERED">Delivered</option>
              <option value="REJECT_BY_CUSTOMER">Cancelled</option>
              <option value="REJECT_BY_MERCHANT">Rejected by merchant</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs section-meta">Sort</label>
            <select
              className="field text-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="amount_desc">Amount: High → Low</option>
              <option value="amount_asc">Amount: Low → High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <OrdersSection
          title="Active"
          loading={loading}
          emptyText="You have no active orders."
          items={activeOrders}
          renderItem={(o) => (
            <OrderRow
              key={o.orderId}
              order={o}
              reason={reasons[o.orderId] || ""}
              setReason={(v) =>
                setReasons((r) => ({ ...r, [o.orderId]: v }))
              }
              expanded={!!expanded[o.orderId]}
              onOpen={() => openCancel(o.orderId)}
              onClose={() => closeCancel(o.orderId)}
              onConfirm={() => onCancel(o.orderId)}
            />
          )}
        />

        <OrdersSection
          title="History"
          loading={loading}
          emptyText="No completed orders yet."
          items={historyOrders}
          renderItem={(o) => <OrderRow key={o.orderId} order={o} readOnly />}
        />
      </div>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function OrdersSection({ title, loading, items, emptyText, renderItem }) {
  return (
    <div className="token-card">
      <div className="section-head px-4 py-3 flex items-center justify-between rounded-t-[inherit]">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs section-meta">
          {items.length} item{items.length === 1 ? "" : "s"}
        </span>
      </div>
      {loading ? (
        <div className="p-8 text-center section-meta">Loading…</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center section-meta text-sm">{emptyText}</div>
      ) : (
        <ul className="order-list">{items.map(renderItem)}</ul>
      )}
    </div>
  );
}

function OrderRow({
  order,
  reason,
  setReason,
  expanded,
  onOpen,
  onClose,
  onConfirm,
  readOnly = false,
}) {
  const canCancel = useMemo(() => {
    return (
      order.status !== "DELIVERED" &&
      order.status !== "REJECT_BY_CUSTOMER" &&
      order.status !== "REJECT_BY_MERCHANT"
    );
  }, [order.status]);

  return (
    <li className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* LEFT: info */}
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <h3 className="font-medium truncate">{order.productName}</h3>
            <StatusPill status={order.status} />
          </div>

          <div className="mt-1 text-sm section-meta">
            <span className="mr-4">
              Count: <b>{order.count}</b>
            </span>
            <span>
              Total: <b>{formatCurrency(order.totalAmount)}</b>
            </span>
          </div>

          <div className="mt-1 text-xs section-meta">
            Placed: {formatDate(order.createdAt)}
          </div>

          {!!order.rejectReason && (
            <div className="mt-2 text-xs section-meta">
              Reason: {order.rejectReason}
            </div>
          )}
        </div>

        {/* RIGHT: Cancel flow */}
        <div className="w-full lg:w-96 flex lg:justify-end">
          {readOnly ? (
            <div className="text-sm section-meta lg:text-right w-full lg:w-auto">
              This order is completed.
            </div>
          ) : canCancel ? (
            !expanded ? (
              <button
                onClick={onOpen}
                className="btn btn-secondary text-sm lg:ml-auto"
              >
                Cancel order
              </button>
            ) : (
              <div className="callout p-3 w-full max-w-md lg:ml-auto">
                <div className="text-xs font-medium mb-2">
                  Please provide a reason to cancel:
                </div>
                <input
                  className="field w-full text-sm"
                  placeholder="Reason to cancel…"
                  value={reason}
                  onChange={(e) => setReason && setReason(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onConfirm();
                    if (e.key === "Escape") onClose();
                  }}
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={onConfirm}
                    disabled={!reason.trim()}
                    className="btn btn-primary text-sm"
                  >
                    Confirm cancel
                  </button>
                  <button
                    onClick={onClose}
                    className="btn btn-secondary text-sm"
                  >
                    Keep order
                  </button>
                </div>
                <div className="mt-1 text-[11px] section-meta">
                  Tip: Press <b>Enter</b> to confirm or <b>Esc</b> to close.
                </div>
              </div>
            )
          ) : (
            <div className="text-sm section-meta">This order can’t be cancelled.</div>
          )}
        </div>
      </div>
    </li>
  );
}

function StatusPill({ status }) {
  return (
    <span className="status-pill" data-tone={statusTone(status)} title={status}>
      {labelForStatus(status)}
    </span>
  );
}

/* ---------- Utils ---------- */

function formatCurrency(n) {
  if (typeof n !== "number") return n;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

function formatDate(isoLike) {
  try {
    const d = new Date(isoLike);
    return d.toLocaleString();
  } catch {
    return isoLike;
  }
}

function statusTone(status) {
  switch (status) {
    case "CREATED":
      return "new";
    case "PAID_FROM_BALANCE":
      return "progress";
    case "ACCEPTED":
      return "progress";
    case "DELIVERED":
      return "success";
    case "REJECT_BY_CUSTOMER":
      return "danger";
    case "REJECT_BY_MERCHANT":
      return "danger";
    default:
      return "new";
  }
}

function labelForStatus(s) {
  switch (s) {
    case "CREATED":
      return "Created";
    case "PAID_FROM_BALANCE":
      return "Paid from balance";
    case "ACCEPTED":
      return "Accepted";
    case "DELIVERED":
      return "Delivered";
    case "REJECT_BY_CUSTOMER":
      return "Cancelled by you";
    case "REJECT_BY_MERCHANT":
      return "Rejected by merchant";
    default:
      return s;
  }
}
