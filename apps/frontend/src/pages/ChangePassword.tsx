import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Field, Input, Logo } from "@hrm-plus/ui";
import { useAuth } from "../auth/AuthContext";

export default function ChangePassword() {
  const { changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to change password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
      <div className="w-full max-w-sm space-y-5">
        <Logo size="md" className="justify-center" />
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Set a new password</h1>
              <p className="text-sm text-slate-500">
                You're using a temporary password. Choose a new one to continue.
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <Field label="Current password">
              <Input
                type="password"
                required
                minLength={8}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </Field>
            <Field label="New password">
              <Input
                type="password"
                required
                minLength={8}
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
              Set password
            </Button>
            <Button type="button" variant="ghost" onClick={logout} className="w-full">
              Sign out
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
