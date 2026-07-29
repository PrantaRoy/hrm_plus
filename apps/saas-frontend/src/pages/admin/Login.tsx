import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Field, Input, Logo } from "@hrm-plus/ui";
import { useSaasAuth } from "../../auth/SaasAuthContext";

export default function Login() {
  const { login } = useSaasAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate("/admin/overview");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-slate-900 p-12 text-white">
        <Logo size="md" wordmarkClassName="text-white" />
        <div className="max-w-sm">
          <h2 className="text-3xl font-semibold leading-tight">Super admin console</h2>
          <p className="mt-4 text-slate-300">
            Manage packages, review tenant applications, and oversee every company on the
            platform.
          </p>
        </div>
        <p className="text-sm text-slate-400">© {new Date().getFullYear()} HRM Plus</p>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center bg-slate-50 p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
          <div className="lg:hidden mb-2">
            <Logo size="md" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
            <p className="text-sm text-slate-500">Super-admin sign in</p>
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <Field label="Email">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          <Button type="submit" isLoading={submitting} className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
