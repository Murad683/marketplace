import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveAuth } from "../auth";
import { loginRequest } from "../api";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await loginRequest({
        username: form.username.trim(),
        password: form.password,
      });

      saveAuth({
        token: data.token,
        tokenType: data.tokenType,
        username: data.username || form.username,
        type: data.type || "CUSTOMER",
      });

      navigate("/");
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError("Invalid username or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-14 token-card p-8">
      <header className="text-center mb-6 space-y-1">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm section-meta">Please sign in to continue.</p>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="field w-full"
          required
        />

        <div>
          <div className="flex gap-2">
            <input
              type={showPass ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="field w-full"
              required
            />
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              className="btn btn-secondary text-xs h-[40px] px-3"
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary w-full text-sm"
        >
          {submitting ? "Signing in…" : "Login"}
        </button>
      </form>
    </div>
  );
}
