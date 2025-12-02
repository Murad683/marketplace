import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMerchantProfile } from "../api";
import { useAuth } from "../hooks/useAuth";

export default function MerchantProfilePage() {
  const { auth, isMerchant, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isMerchant) {
      navigate("/login", { replace: true });
    }
  }, [isMerchant, navigate]);

  useEffect(() => {
    if (!isMerchant) return;
    setLoading(true);
    setError("");

    getMerchantProfile(auth)
      .then(setProfile)
      .catch((err) => setError(err.message || "Failed to load profile"))
      .finally(() => setLoading(false));
  }, [auth, isMerchant]);

  if (!isMerchant) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Merchant Profile</h1>
          <p className="text-sm section-meta">Account and business details.</p>
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
              <h2 className="text-sm font-semibold">Account</h2>
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
              <h2 className="text-sm font-semibold">Business</h2>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <InfoRow label="Company" value={profile?.companyName || "—"} />
            </div>
          </div>
        </div>
      )}

      <div className="token-card p-4 mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm section-meta">
          Sign out of your merchant account to end this session.
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
