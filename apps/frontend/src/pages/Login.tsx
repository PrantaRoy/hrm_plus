import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tenantSlug, setTenantSlug] = useState(import.meta.env.VITE_DEFAULT_TENANT_SLUG ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(tenantSlug.trim(), email.trim(), password);
      navigate("/employees");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-lg shadow p-8 space-y-4"
      >
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">HRM PLUS</h1>
          <p className="text-sm text-slate-500">Sign in to your organisation's workspace</p>
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}

        <Field label="Organisation slug" value={tenantSlug} onChange={setTenantSlug} placeholder="acme" />
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@acme.com" />
        <Field label="Password" type="password" value={password} onChange={setPassword} />

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-slate-900 text-white rounded py-2 font-medium disabled:opacity-50"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700 font-medium">{label}</span>
      <input
        type={type}
        required
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
    </label>
  );
}
