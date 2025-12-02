import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../api";
import { useAuth } from "../hooks/useAuth";

export default function ProfilePage() {
  const { auth, isCustomer, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isCustomer) {
      navigate("/login", { replace: true });
    }
  }, [isCustomer, navigate]);

  useEffect(() => {
    if (!isCustomer) return;
    setLoading(true);
    setError("");

    getProfile(auth)
      .then(setProfile)
      .catch((err) => {
        setError(err.message || "Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, [auth, isCustomer]);

  const balanceValue = useMemo(() => {
    if (!profile) return 0;
    if (typeof profile.balance === "number") return profile.balance;
    const parsed = Number(profile.balance);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [profile]);

  const hasBalance = balanceValue > 0;

  if (!isCustomer) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <p className="text-sm section-meta">
            Your personal info and credit balance.
          </p>
        </div>
        {profile?.email && (
          <span className="chip text-xs py-2 px-3 section-meta">
            {profile.email}
          </span>
        )}
      </div>

      {error && (
        <div className="token-card p-4 mb-4 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="token-card p-6 text-sm section-meta">Loading profile…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="token-card h-full">
            <div className="section-head px-4 py-3 rounded-t-[inherit]">
              <h2 className="text-sm font-semibold">Personal Information</h2>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <InfoRow label="Name" value={fullName(profile)} />
              <InfoRow label="Email" value={profile?.email || "—"} />
              <InfoRow
                label="Member since"
                value={profile?.createdAt ? formatDate(profile.createdAt) : "—"}
              />
            </div>
          </div>

          <div className="token-card h-full">
            <div className="section-head px-4 py-3 rounded-t-[inherit]">
              <h2 className="text-sm font-semibold">Balance</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="text-sm section-meta">Available credit</div>
              <div className="text-3xl font-semibold tracking-tight">
                {formatCurrency(balanceValue)}
              </div>
              <p className="text-sm section-meta">
                {hasBalance
                  ? "Orders will be paid from your available balance."
                  : "You currently have no balance."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="token-card p-4 mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm section-meta">
          Sign out of your account to end this session.
        </div>
        <button
          type="button"
          onClick={logout}
          className="btn btn-secondary text-sm w-full sm:w-auto"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

function fullName(profile) {
  const name = profile?.name || "";
  const surname = profile?.surname || "";
  return `${name} ${surname}`.trim() || "—";
}

function formatCurrency(n) {
  const value = typeof n === "number" ? n : Number(n || 0);
  if (!Number.isFinite(value)) return n;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
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

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="section-meta text-xs uppercase tracking-[0.08em]">
        {label}
      </span>
      <span className="font-medium text-sm text-right">{value}</span>
    </div>
  );
}
