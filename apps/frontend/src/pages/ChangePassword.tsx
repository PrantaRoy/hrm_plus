import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
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
      navigate("/employees");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to change password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-lg shadow p-8 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Set a new password</h1>
          <p className="text-sm text-slate-500">
            You're using a temporary password. Choose a new one to continue.
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}

        <Field label="Current password" value={currentPassword} onChange={setCurrentPassword} />
        <Field label="New password" value={newPassword} onChange={setNewPassword} />
        <Field label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} />

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-slate-900 text-white rounded py-2 font-medium disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Set password"}
        </button>
        <button type="button" onClick={logout} className="w-full text-sm text-slate-500 underline">
          Sign out
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700 font-medium">{label}</span>
      <input
        type="password"
        required
        minLength={8}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
    </label>
  );
}
