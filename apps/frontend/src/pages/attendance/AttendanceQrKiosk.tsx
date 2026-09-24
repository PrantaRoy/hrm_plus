import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Spinner } from "@hrm-plus/ui";
import { getQrKioskToken } from "../../api/attendance";
import { getOrCreateKioskSessionId } from "../../utils/attendanceQrKiosk";

const POLL_MS = 5000;

export default function AttendanceQrKiosk() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<number>();

  useEffect(() => {
    getOrCreateKioskSessionId()
      .then(setSessionId)
      .catch(() => setError("Could not start a kiosk session."));
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    async function fetchToken() {
      try {
        const result = await getQrKioskToken(sessionId!);
        setQrImage(result.qrImageDataUri);
        setExpiresAt(result.expiresAt);
        setError(null);
      } catch {
        setError("Kiosk session expired — reload this page.");
      }
    }

    fetchToken();
    pollTimerRef.current = window.setInterval(fetchToken, POLL_MS);
    return () => window.clearInterval(pollTimerRef.current);
  }, [sessionId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const secondsLeft = expiresAt ? Math.max(0, Math.round((new Date(expiresAt).getTime() - now) / 1000)) : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-8 text-white">
      <h1 className="mb-2 text-2xl font-semibold">Scan to check in / check out</h1>
      <p className="mb-8 text-sm text-slate-400">Open the app on your phone and scan this code</p>

      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

      {qrImage ? (
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-xl bg-white p-6">
            <img src={qrImage} alt="Attendance QR code" width={280} height={280} />
          </div>
          {secondsLeft !== null && (
            <p className="text-sm text-slate-400">
              Refreshes in <span className="font-semibold text-white">{secondsLeft}s</span>
            </p>
          )}
        </div>
      ) : (
        !error && <Spinner />
      )}

      <p className="mt-10 text-xs text-slate-500">
        Need a permanent code instead of a live screen?{" "}
        <Link to="/attendance/kiosk/print" className="underline hover:text-slate-300">
          Generate a printable QR code
        </Link>
      </p>
    </div>
  );
}
