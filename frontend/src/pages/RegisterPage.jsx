import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveAuth } from "../auth";
import { registerRequest } from "../api";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    surname: "",
    type: "CUSTOMER",
    companyName: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        surname: form.surname.trim(),
        type: form.type,
        companyName: form.type === "MERCHANT" ? form.companyName.trim() : "",
      };
      const data = await registerRequest(payload);

      saveAuth({
        token: data.token,
        tokenType: data.tokenType,
        email: data.email || payload.email,
        type: data.type || payload.type,
      });
      navigate("/");
      window.location.reload();
    } catch (err) {
      // Try to surface backend message if available
      let msg = "Registration failed. Please check fields and try again.";
      if (err?.message) {
        try {
          const parsed = JSON.parse(err.message);
          msg = parsed?.message || msg;
        } catch {
          msg = err.message || msg;
        }
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-12 token-card p-8">
      <h1 className="text-2xl font-semibold mb-1 text-center">
        Create your account
      </h1>
      <p className="text-sm section-meta text-center mb-6">
        It takes less than a minute.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium section-meta">
              Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="field w-full"
              placeholder="Name"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium section-meta">
              Surname
            </label>
            <input
              name="surname"
              value={form.surname}
              onChange={handleChange}
              className="field w-full"
              placeholder="Surname"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium section-meta">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="field w-full"
            placeholder="Email"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium section-meta">
            Password
          </label>
          <div className="flex gap-2">
            <input
              type={showPass ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              className="field w-full"
              placeholder="Password"
              required
              minLength={5}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium section-meta">
              Account Type
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="field w-full"
            >
              <option value="CUSTOMER">Customer</option>
              <option value="MERCHANT">Merchant</option>
            </select>
          </div>

          {form.type === "MERCHANT" && (
            <div>
              <label className="mb-1 block text-xs font-medium section-meta">
                Company Name
              </label>
              <input
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                className="field w-full"
                placeholder="Your company"
                required
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary w-full text-sm"
        >
          {submitting ? "Creating…" : "Register"}
        </button>
      </form>
    </div>
  );
}
