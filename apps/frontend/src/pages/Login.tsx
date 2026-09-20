import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, Field, Input, Logo } from "@hrm-plus/ui";
import * as authApi from "../api/auth";
import { useAuth } from "../auth/AuthContext";
import { useTenantSubdomain } from "../hooks/useTenantSubdomain";

type Step = "email" | "password";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const subdomainTenantSlug = useTenantSubdomain();
  const [step, setStep] = useState<Step>("email");
  const [tenantSlug, setTenantSlug] = useState(
    subdomainTenantSlug ?? import.meta.env.VITE_DEFAULT_TENANT_SLUG ?? ""
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { exists } = await authApi.checkEmail(tenantSlug.trim(), email.trim());
      if (!exists) {
        setError("No account found with that email for this organisation");
        return;
      }
      setStep("password");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(tenantSlug.trim(), email.trim(), password);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-sidebar via-[#16213f] to-brand-900 p-12 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />
        <Logo size="md" tone="light" className="relative" />
        <div className="relative max-w-sm">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            One place to run your entire HR operation.
          </h2>
          <p className="mt-4 text-slate-300">
            Employee records, departments, roles, and workforce settings — organised for growing
            teams.
          </p>
        </div>
        <p className="relative text-sm text-slate-400">© {new Date().getFullYear()} HRM Plus</p>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center bg-canvas p-6 sm:p-8">
        <form
          onSubmit={step === "email" ? handleContinue : handleLogin}
          className="w-full max-w-sm space-y-5 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-pop sm:p-8"
        >
          <div className="lg:hidden mb-2">
            <Logo size="md" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
            <p className="text-sm text-slate-500">Sign in to your organisation's workspace</p>
          </div>

          {error && (
            <Alert>{error}</Alert>
          )}

          {step === "email" ? (
            <>
              <Field label="Organisation slug">
                {subdomainTenantSlug ? (
                  <Input required readOnly value={tenantSlug} className="bg-slate-100" />
                ) : (
                  <Input
                    required
                    value={tenantSlug}
                    onChange={(e) => setTenantSlug(e.target.value)}
                    placeholder="acme"
                  />
                )}
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@acme.com"
                />
              </Field>
            </>
          ) : (
            <>
              <div className="text-sm text-slate-600">
                Signing in as <span className="font-medium text-slate-900">{email}</span> ({tenantSlug})
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="ml-2 text-brand-600 underline"
                >
                  Change
                </button>
              </div>
              <Field label="Password">
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-brand-600 underline">
                  Forgot password?
                </Link>
              </div>
            </>
          )}

          <Button type="submit" isLoading={submitting} className="w-full">
            {step === "email" ? "Continue" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
