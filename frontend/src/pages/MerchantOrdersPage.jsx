import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { getMerchantOrders, updateOrderStatus } from "../api";

// Xəritə: backend enum -> ekranda göstərilən label
const STATUS_OPTIONS = [
  { value: "CREATED", label: "CREATED" },
  { value: "ACCEPTED", label: "ACCEPTED" },
  { value: "REJECT_BY_MERCHANT", label: "REJECT BY MERCHANT" },
  { value: "DELIVERED", label: "DELIVERED" },
];

const COMPLETED_STATUSES = new Set(["DELIVERED", "REJECT_BY_MERCHANT"]);

function OrderRow({ order, onUpdate, saving, compact = false, lockInitially = false }) {
  const [status, setStatus] = useState(order.status);
  const [reason, setReason] = useState(order.rejectReason || "");
  const [editing, setEditing] = useState(!lockInitially);

  const handleSave = () => {
    if (!editing) return;
    onUpdate(order.orderId, status, reason);
  };

  const handleEditToggle = () => {
    if (editing) {
      // cancel edits → reset to original
      setStatus(order.status);
      setReason(order.rejectReason || "");
      setEditing(false);
    } else {
      setEditing(true);
    }
  };

  const needsReason = status === "REJECT_BY_MERCHANT"; // sadə məntiq

  // Sync local state when order changes (after save)
  useEffect(() => {
    setStatus(order.status);
    setReason(order.rejectReason || "");
    if (lockInitially) {
      setEditing(false);
    }
  }, [order.orderId, order.status, order.rejectReason, lockInitially]);

  const tone =
    order.status === "DELIVERED"
      ? "success"
      : order.status === "REJECT_BY_MERCHANT"
      ? "danger"
      : "progress";

  return (
    <li
      className={`${
        compact ? "p-3 md:p-3" : "p-4"
      } flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between`}
    >
      {/* ORDER INFO */}
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="font-semibold">{order.productName}</div>
          <span className="status-pill" data-tone={tone}>
            {order.status.replaceAll("_", " ")}
          </span>
        </div>
        <div className="text-sm section-meta mt-0.5">
          Count: {order.count} | Total: ${order.totalAmount}
        </div>
        <div className="text-xs section-meta">Created: {order.createdAt}</div>

        {order.rejectReason && (
          <div className="text-xs text-red-600 mt-1">
            Prev Reason: {order.rejectReason}
          </div>
        )}
      </div>

      {/* ACTIONS */}
      <div className={`flex-1 flex flex-col gap-2 ${compact ? "max-w-md" : "max-w-sm"}`}>
        <label className="text-xs font-medium section-meta">Status</label>
        <select
          className="field text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={!editing}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option value={opt.value} key={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <label className="text-xs font-medium section-meta flex items-center gap-2">
          Reject Reason
          <span className="text-[10px] section-meta">
            (only when rejecting)
          </span>
        </label>
        <input
          className="field text-sm"
          placeholder="Reason if rejected"
          disabled={!editing || !needsReason}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <button
          disabled={saving || !editing}
          onClick={handleSave}
          className="btn btn-primary text-sm"
        >
          {saving ? "Saving..." : "Save"}
        </button>

        {lockInitially && (
          <button
            type="button"
            onClick={handleEditToggle}
            className="text-xs underline section-meta self-start"
          >
            {editing ? "Cancel edit" : "Edit"}
          </button>
        )}
      </div>
    </li>
  );
}

export default function MerchantOrdersPage() {
  const { auth, isMerchant } = useAuth();
  const [orders, setOrders] = useState([]);
  const [savingId, setSavingId] = useState(null);

  const activeOrders = orders.filter((o) => !COMPLETED_STATUSES.has(o.status));
  const completedOrders = orders.filter((o) => COMPLETED_STATUSES.has(o.status));

  const load = () => {
    getMerchantOrders(auth)
      .then(setOrders)
      .catch(() => setOrders([]));
  };

  useEffect(() => {
    if (isMerchant) load();
  }, [isMerchant]);

  const handleUpdate = async (orderId, status, rejectReason) => {
    try {
      setSavingId(orderId);

      // PATCH /merchant/orders/{orderId}/status
      // body: { status: "...", rejectReason: "..." }
      await updateOrderStatus(
        orderId,
        { status, rejectReason },
        auth
      );

      load();
    } catch (err) {
      alert("Failed to update order: " + err.message);
    } finally {
      setSavingId(null);
    }
  };

  if (!isMerchant) {
    return (
      <div className="token-card max-w-md mx-auto mt-10 text-center p-8 section-meta">
        Only merchants can view orders.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-3">Incoming Orders</h1>
      <p className="text-sm section-meta mb-6">
        Active above, completed below. You can still edit completed ones to fix mistakes.
      </p>

      <Section
        title="Active"
        emptyText="No active orders."
        items={activeOrders}
        savingId={savingId}
        onUpdate={handleUpdate}
        lockInitially={false}
      />

      <div className="h-6" />

      <Section
        title="History"
        emptyText="No completed orders yet."
        items={completedOrders}
        savingId={savingId}
        onUpdate={handleUpdate}
        subtle
        lockInitially
      />
    </div>
  );
}

function Section({ title, emptyText, items, savingId, onUpdate, subtle = false, lockInitially = false }) {
  return (
    <div className="token-card overflow-hidden">
      <div className="section-head px-4 py-3 flex items-center justify-between rounded-t-[inherit]">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs section-meta">{items.length} item{items.length === 1 ? "" : "s"}</span>
      </div>
      {items.length === 0 ? (
        <div className="text-center section-meta p-6 text-sm">{emptyText}</div>
      ) : (
        <ul className="order-list">
          {items.map((o) => (
            <OrderRow
              key={o.orderId}
              order={o}
              saving={savingId === o.orderId}
              onUpdate={onUpdate}
              compact={subtle}
              lockInitially={lockInitially}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
