import { useEffect, useState } from "react";
import { Card, Textarea, cn } from "@hrm-plus/ui";
import { AttendanceMethod, CheckInInput, CheckOutInput, TodayAttendanceDto } from "@hrm-plus/shared";
import { checkIn, checkOut, endBreak, getTodayAttendance, startBreak } from "../../api/attendance";
import { getGeneralSettings } from "../../api/generalSettings";
import { useAuth } from "../../auth/AuthContext";
import { useLongPress } from "../../hooks/useLongPress";
import { getDeviceToken } from "../../utils/deviceToken";
import { QrScanner } from "./QrScanner";

const HOLD_MS = 2000;

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

// Duty schedule "HH:mm" times are wall-clock in the tenant's configured timezone
// (General Settings), not UTC — mirrored here (via Intl, same approach as the
// backend's combineDateAndTimeInZone) so the reason field appears before the round
// trip, not after a server-side rejection.
function minutesSinceMidnightInZone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return (Number(map.hour) % 24) * 60 + Number(map.minute);
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
  size?: number;
}

function HoldButton({ label, subLabel, onComplete, disabled, tone, size = 132 }: HoldButtonProps) {
  const { progress, isPressing, handlers } = useLongPress(onComplete, { thresholdMs: HOLD_MS, disabled });
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

  const [deviceToken] = useState(() => getDeviceToken());
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [timezone, setTimezone] = useState("UTC");
  const [scanningFor, setScanningFor] = useState<"checkin" | "checkout" | null>(null);

  function refresh() {
    setLoading(true);
    getTodayAttendance()
      .then(setToday)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load attendance"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  useEffect(() => {
    getGeneralSettings()
      .then((settings) => setTimezone(settings.timezone))
      .catch(() => setTimezone("UTC"));
  }, []);

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => setBanner(null), 5000);
    return () => window.clearTimeout(timer);
  }, [banner]);

  // Only prompt for real GPS access when this employee actually has location
  // binding enabled — most staff never see a permission prompt at all.
  useEffect(() => {
    if (!today?.requiresLocationBinding || coords || locating) return;
    if (!navigator.geolocation) {
      setLocationError("Location access is not available in this browser");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocating(false);
      },
      (geoError) => {
        setLocationError(geoError.message || "Could not get your current location");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [today?.requiresLocationBinding, coords, locating]);

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

  const nowMinutes = minutesSinceMidnightInZone(new Date(), timezone);
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

  const locationBlocked = today.requiresLocationBinding && !coords;
  const geoFields = coords ? { latitude: coords.latitude, longitude: coords.longitude } : {};

  async function submitCheckIn(method: AttendanceMethod, extra: Partial<CheckInInput> = {}) {
    setBusy(true);
    setError(null);
    try {
      const result = await checkIn({ method, deviceToken, ...geoFields, ...extra });
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

  async function handleCheckIn() {
    await submitCheckIn("PressAndHold", { reason: lateReason.trim() || undefined });
  }

  async function handleResume() {
    await submitCheckIn("PressAndHold");
  }

  async function handleCheckOut(method: AttendanceMethod, extra: Partial<CheckOutInput> = {}) {
    setBusy(true);
    setError(null);
    try {
      const result = await checkOut({
        method,
        reason: earlyReason.trim() || undefined,
        deviceToken,
        ...geoFields,
        ...extra,
      });
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

  function handlePressAndHoldCheckOut() {
    return handleCheckOut("PressAndHold");
  }

  async function handleQrDecode(decodedText: string) {
    const action = scanningFor;
    setScanningFor(null);
    if (action === "checkin") {
      await submitCheckIn("QrCode", { qrToken: decodedText, reason: lateReason.trim() || undefined });
    } else if (action === "checkout") {
      await handleCheckOut("QrCode", { qrToken: decodedText });
    }
  }

  const canUseQr = today.availableMethods.includes("QrCode");
  const canUsePressAndHold = today.availableMethods.includes("PressAndHold");

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

        {today.requiresIpBinding && (
          <p className="text-xs text-slate-400">Attendance from this account is restricted to approved networks.</p>
        )}
        {today.requiresLocationBinding && locating && (
          <p className="text-xs text-slate-400">Getting your location…</p>
        )}
        {today.requiresLocationBinding && locationError && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {locationError} — location access is required to check in/out.
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
            {canUsePressAndHold && (
              <HoldButton
                label="Hold to check in"
                subLabel={`${HOLD_MS / 1000}s`}
                tone="brand"
                disabled={busy || locationBlocked || (isLikelyLate && !lateReason.trim())}
                onComplete={handleCheckIn}
              />
            )}
            {canUseQr && (
              <button
                type="button"
                disabled={busy || (isLikelyLate && !lateReason.trim())}
                onClick={() => setScanningFor("checkin")}
                className="rounded-md border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Scan QR to check in
              </button>
            )}
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
                {canUsePressAndHold && (
                  <HoldButton
                    label="Hold to check out"
                    subLabel={`${HOLD_MS / 1000}s`}
                    tone="slate"
                    disabled={busy || locationBlocked || (isLikelyEarlyCheckout && !earlyReason.trim())}
                    onComplete={handlePressAndHoldCheckOut}
                  />
                )}
                {canUseQr && (
                  <button
                    type="button"
                    disabled={busy || (isLikelyEarlyCheckout && !earlyReason.trim())}
                    onClick={() => setScanningFor("checkout")}
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Scan QR to check out
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Checked out */}
        {today.attendance?.checkOutAt && (
          <div className="space-y-3 text-sm">
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

            {today.canResumeAfterCheckout ? (
              <div className="flex flex-col items-center gap-2 pt-2">
                <p className="text-center text-xs text-slate-400">
                  Checked out by mistake? You can still check in again before your shift ends.
                </p>
                <HoldButton
                  label="Hold to check in again"
                  subLabel={`${HOLD_MS / 1000}s`}
                  tone="slate"
                  size={104}
                  disabled={busy || locationBlocked}
                  onComplete={handleResume}
                />
              </div>
            ) : (
              <p className="pt-2 text-center text-xs text-slate-400">You're all done for today.</p>
            )}
          </div>
        )}
      </div>
      {scanningFor && <QrScanner onDecode={handleQrDecode} onClose={() => setScanningFor(null)} />}
    </Card>
  );
}
