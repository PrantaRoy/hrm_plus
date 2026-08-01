import { useEffect, useState } from "react";
import { Card, Textarea, cn } from "@hrm-plus/ui";
import { TodayAttendanceDto } from "@hrm-plus/shared";
import { checkIn, checkOut, endBreak, getTodayAttendance, startBreak } from "../../api/attendance";
import { useAuth } from "../../auth/AuthContext";
import { useLongPress } from "../../hooks/useLongPress";

const HOLD_MS = 2000;
const METHOD = "PressAndHold" as const;

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function greetingWord(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// The backend has no per-tenant timezone support yet, so "HH:mm" schedule times
// are compared against the current UTC time-of-day — mirrored here so the reason
// field appears before the round trip, not after a server-side rejection.
function minutesSinceMidnightUTC(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

function parseHHMM(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

interface HoldButtonProps {
  label: string;
  subLabel: string;
  onComplete: () => void;
  disabled?: boolean;
  tone: "brand" | "slate";
}

function HoldButton({ label, subLabel, onComplete, disabled, tone }: HoldButtonProps) {
  const { progress, isPressing, handlers } = useLongPress(onComplete, { thresholdMs: HOLD_MS, disabled });
  const size = 132;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ringColor = tone === "brand" ? "#2563eb" : "#475569";

  return (
    <button
      type="button"
      disabled={disabled}
      {...handlers}
      className={cn(
        "relative flex items-center justify-center rounded-full border-2 select-none transition-transform",
        tone === "brand" ? "border-brand-100 bg-brand-50" : "border-slate-200 bg-slate-50",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95",
        isPressing && "scale-105"
      )}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e2e8f0" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          strokeLinecap="round"
          style={{ transition: isPressing ? "none" : "stroke-dashoffset 150ms ease-out" }}
        />
      </svg>
      <span className="relative z-10 flex flex-col items-center px-2 text-center">
        <span className="text-sm font-semibold text-slate-900">{label}</span>
        <span className="text-[11px] text-slate-500">{subLabel}</span>
      </span>
    </button>
  );
}

export function AttendanceWidget() {
  const { user } = useAuth();
  const [today, setToday] = useState<TodayAttendanceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [lateReason, setLateReason] = useState("");
  const [earlyReason, setEarlyReason] = useState("");
  const [busy, setBusy] = useState(false);

  function refresh() {
    setLoading(true);
    getTodayAttendance()
      .then(setToday)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load attendance"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => setBanner(null), 5000);
    return () => window.clearTimeout(timer);
  }, [banner]);

  if (loading) {
    return (
      <Card title="Attendance">
        <p className="text-sm text-slate-400">Loading today's attendance…</p>
      </Card>
    );
  }

  if (!today) {
    return null;
  }

  const nowMinutes = minutesSinceMidnightUTC(new Date());
  const startMinutes = today.scheduledStart ? parseHHMM(today.scheduledStart) : null;
  const endMinutes = today.scheduledEnd ? parseHHMM(today.scheduledEnd) : null;
  const isLikelyLate =
    !today.attendance?.checkInAt &&
    startMinutes !== null &&
    today.checkinConsiderMinutes !== null &&
    nowMinutes > startMinutes + today.checkinConsiderMinutes;
  const isLikelyEarlyCheckout =
    !!today.attendance?.checkInAt &&
    !today.attendance?.checkOutAt &&
    endMinutes !== null &&
    today.checkoutConsiderMinutes !== null &&
    nowMinutes < endMinutes - today.checkoutConsiderMinutes;

  async function handleCheckIn() {
    setBusy(true);
    setError(null);
    try {
      const result = await checkIn({ method: METHOD, reason: lateReason.trim() || undefined });
      setToday(result);
      setLateReason("");
      const lateNote = result.attendance?.isLate ? " You're marked late for today." : "";
      setBanner(
        `${greetingWord(new Date())}, ${user?.firstName ?? ""}! You're checked in at ${formatTime(
          result.attendance?.checkInAt
        )}.${lateNote}`
      );
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to check in");
    } finally {
      setBusy(false);
    }
  }

  async function handleCheckOut() {
    setBusy(true);
    setError(null);
    try {
      const result = await checkOut({ method: METHOD, reason: earlyReason.trim() || undefined });
      setToday(result);
      setEarlyReason("");
      setBanner(
        `${greetingWord(new Date())}, ${user?.firstName ?? ""}! You're checked out at ${formatTime(
          result.attendance?.checkOutAt
        )}. See you next time.`
      );
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to check out");
    } finally {
      setBusy(false);
    }
  }

  async function handleStartBreak() {
    setError(null);
    try {
      setToday(await startBreak());
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to start break");
    }
  }

  async function handleEndBreak() {
    setError(null);
    try {
      setToday(await endBreak());
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to end break");
    }
  }

  return (
    <Card title="Attendance" description={today.dutyScheduleName ? `Today's duty: ${today.dutyScheduleName}` : undefined}>
      <div className="space-y-4">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}
        {banner && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
            {banner}
          </div>
        )}

        {today.blockedReason && !today.attendance?.checkInAt && (
          <p className="text-sm text-slate-500">{today.blockedReason}</p>
        )}

        {!today.blockedReason && today.availableMethods.length === 0 && !today.attendance?.checkInAt && (
          <p className="text-sm text-slate-500">
            No attendance method is enabled for you yet. Contact HR to get set up.
          </p>
        )}

        {/* Not checked in yet */}
        {!today.attendance?.checkInAt && !today.blockedReason && today.availableMethods.length > 0 && (
          <div className="flex flex-col items-center gap-4 py-2">
            {isLikelyLate && (
              <div className="w-full max-w-sm space-y-1">
                <label className="block text-sm font-medium text-slate-700">Reason for late check-in</label>
                <Textarea
                  rows={2}
                  value={lateReason}
                  onChange={(e) => setLateReason(e.target.value)}
                  placeholder="Why are you checking in late?"
                />
              </div>
            )}
            <HoldButton
              label="Hold to check in"
              subLabel={`${HOLD_MS / 1000}s`}
              tone="brand"
              disabled={busy || (isLikelyLate && !lateReason.trim())}
              onComplete={handleCheckIn}
            />
          </div>
        )}

        {/* Checked in, not checked out */}
        {today.attendance?.checkInAt && !today.attendance?.checkOutAt && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Checked in at</span>
              <span className="font-medium text-slate-900">
                {formatTime(today.attendance.checkInAt)}
                {today.attendance.isLate && <span className="ml-1 text-amber-600">(late)</span>}
              </span>
            </div>

            <div className="flex items-center justify-center gap-3">
              {today.canStartBreak && (
                <button
                  type="button"
                  onClick={handleStartBreak}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Start Break
                </button>
              )}
              {today.canEndBreak && (
                <button
                  type="button"
                  onClick={handleEndBreak}
                  className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                >
                  End Break
                </button>
              )}
            </div>

            {today.isOnBreak ? (
              <p className="text-center text-xs text-amber-600">On break — end your break to check out.</p>
            ) : (
              <div className="flex flex-col items-center gap-4 pt-2">
                {isLikelyEarlyCheckout && (
                  <div className="w-full max-w-sm space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Reason for early checkout</label>
                    <Textarea
                      rows={2}
                      value={earlyReason}
                      onChange={(e) => setEarlyReason(e.target.value)}
                      placeholder="Why are you checking out early?"
                    />
                  </div>
                )}
                <HoldButton
                  label="Hold to check out"
                  subLabel={`${HOLD_MS / 1000}s`}
                  tone="slate"
                  disabled={busy || (isLikelyEarlyCheckout && !earlyReason.trim())}
                  onComplete={handleCheckOut}
                />
              </div>
            )}
          </div>
        )}

        {/* Completed */}
        {today.attendance?.checkOutAt && (
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Checked in</span>
              <span className="font-medium text-slate-900">{formatTime(today.attendance.checkInAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Checked out</span>
              <span className="font-medium text-slate-900">
                {formatTime(today.attendance.checkOutAt)}
                {today.attendance.isEarlyCheckout && <span className="ml-1 text-amber-600">(early)</span>}
              </span>
            </div>
            <p className="pt-2 text-center text-xs text-slate-400">You're all done for today.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
