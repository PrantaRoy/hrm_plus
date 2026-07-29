import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Field, Input, Logo } from "@hrm-plus/ui";
import * as authApi from "../api/auth";

type Step = "slug" | "email" | "sent";

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("slug");
  const [tenantSlug, setTenantSlug] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleVerifySlug(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { tenantName: name } = await authApi.verifyTenant(tenantSlug.trim());
      setTenantName(name);
      setStep("email");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "We couldn't find that organisation");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestReset(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authApi.requestPasswordReset(tenantSlug.trim(), email.trim());
      setStep("sent");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-brand-600 p-12 text-white">
        <Logo size="md" wordmarkClassName="text-white" />
        <div className="max-w-sm">
          <h2 className="text-3xl font-semibold leading-tight">Forgot your password?</h2>
          <p className="mt-4 text-brand-100">
            We'll email you a link to reset it. The link stays valid for 5 minutes.
          </p>
        </div>
        <p className="text-sm text-brand-200">© {new Date().getFullYear()} HRM Plus</p>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-sm space-y-5">
          <div className="lg:hidden mb-2">
            <Logo size="md" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Reset password</h1>
            <p className="text-sm text-slate-500">
              {step === "slug" && "Enter your organisation slug to continue"}
              {step === "email" && `Enter the email for your ${tenantName} account`}
              {step === "sent" && "Check your inbox"}
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {step === "slug" && (
            <form onSubmit={handleVerifySlug} className="space-y-5">
              <Field label="Organisation slug">
                <Input
                  required
                  autoFocus
                  value={tenantSlug}
                  onChange={(e) => setTenantSlug(e.target.value)}
                  placeholder="acme"
                />
              </Field>
              <Button type="submit" isLoading={submitting} className="w-full">
                Continue
              </Button>
            </form>
          )}

          {step === "email" && (
            <form onSubmit={handleRequestReset} className="space-y-5">
              <div className="text-sm text-slate-600">
                Organisation <span className="font-medium text-slate-900">{tenantSlug}</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep("slug");
                    setError(null);
                  }}
                  className="ml-2 text-brand-600 underline"
                >
                  Change
                </button>
              </div>
              <Field label="Email">
                <Input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@acme.com"
                />
              </Field>
              <Button type="submit" isLoading={submitting} className="w-full">
                Send reset link
              </Button>
            </form>
          )}

          {step === "sent" && (
            <div className="space-y-5">
              <div className="text-sm text-slate-600 bg-white border border-slate-200 rounded-md px-3 py-3">
                If an account exists for <span className="font-medium text-slate-900">{email}</span>, we've
                sent a password reset link. It will expire in 5 minutes.
              </div>
            </div>
          )}

          <div className="text-sm text-slate-500">
            <Link to="/login" className="text-brand-600 underline">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
