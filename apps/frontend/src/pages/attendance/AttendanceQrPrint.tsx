import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Spinner } from "@hrm-plus/ui";
import { getQrKioskStaticToken } from "../../api/attendance";
import { getOrCreateKioskSessionId } from "../../utils/attendanceQrKiosk";

export default function AttendanceQrPrint() {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOrCreateKioskSessionId()
      .then((sessionId) => getQrKioskStaticToken(sessionId))
      .then((result) => setQrImage(result.qrImageDataUri))
      .catch(() => setError("Could not generate a printable QR code."));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white p-8 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Scan to check in / check out</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!qrImage && !error && <Spinner />}
      {qrImage && <img src={qrImage} alt="Attendance QR code" width={320} height={320} />}

      <div className="max-w-sm space-y-4 print:hidden">
        <p className="text-sm text-slate-500">
          This code does not expire — print it and post it somewhere staff-only, like the entrance or break room.
          Unlike the live kiosk screen, anyone who can see this printout can check in/out with it, so don't post it
          somewhere the public can see or photograph it.
        </p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!qrImage}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Print
          </button>
          <Link
            to="/attendance/kiosk"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Use live kiosk screen instead
          </Link>
        </div>
      </div>
    </div>
  );
}
