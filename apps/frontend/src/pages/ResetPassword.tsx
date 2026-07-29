import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Field, Input, Logo } from "@hrm-plus/ui";
import * as authApi from "../api/auth";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";
  const slug = searchParams.get("slug") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const missingLinkParams = !token || !slug;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await authApi.resetPassword(slug, token, newPassword);
      setDone(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ?? "This reset link is invalid or has expired"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-brand-600 p-12 text-white">
        <Logo size="md" wordmarkClassName="text-white" />
        <div className="max-w-sm">
          <h2 className="text-3xl font-semibold leading-tight">Set a new password</h2>
          <p className="mt-4 text-brand-100">Choose a new password for your account.</p>
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
          </div>

          {missingLinkParams && !done && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              This reset link is missing required information. Please request a new one.
            </div>
          )}

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {done ? (
            <div className="space-y-5">
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-3">
                Your password has been reset. You can now sign in with your new password.
              </div>
              <Button className="w-full" onClick={() => navigate("/login")}>
                Go to sign in
              </Button>
            </div>
          ) : (
            !missingLinkParams && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <Field label="New password">
                  <Input
                    type="password"
                    required
                    minLength={8}
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </Field>
                <Field label="Confirm new password">
                  <Input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </Field>
                <Button type="submit" isLoading={submitting} className="w-full">
                  Reset password
                </Button>
              </form>
            )
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
