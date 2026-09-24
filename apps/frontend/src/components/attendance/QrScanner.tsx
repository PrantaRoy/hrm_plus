import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const ELEMENT_ID = "attendance-qr-scanner";

interface QrScannerProps {
  onDecode: (text: string) => void;
  onClose: () => void;
}

export function QrScanner({ onDecode, onClose }: QrScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const decodedRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode(ELEMENT_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          if (decodedRef.current) return;
          decodedRef.current = true;
          onDecode(decodedText);
        },
        () => {
          // per-frame "no QR found" callback — expected on most frames, nothing to do
        }
      )
      .catch(() => setError("Could not access the camera. Check permissions and try again."));

    return () => {
      scanner.stop().catch(() => undefined).finally(() => scanner.clear());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm space-y-3">
        <div id={ELEMENT_ID} className="overflow-hidden rounded-lg bg-black" />
        {error && <p className="text-center text-sm text-red-300">{error}</p>}
        <p className="text-center text-sm text-white">Point your camera at the kiosk QR code</p>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
