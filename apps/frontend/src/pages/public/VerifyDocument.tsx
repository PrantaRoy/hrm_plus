import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { TENANT_HEADER } from "@hrm-plus/shared";
import type { PublicDocumentVerificationDto } from "@hrm-plus/shared";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card, Logo, Spinner } from "@hrm-plus/ui";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export default function VerifyDocument() {
  const { tenantSlug, referenceNumber } = useParams();
  const [result, setResult] = useState<PublicDocumentVerificationDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantSlug || !referenceNumber) return;
    axios
      .get<PublicDocumentVerificationDto>(`${baseURL}/document-verify/${referenceNumber}`, {
        headers: { [TENANT_HEADER]: tenantSlug },
      })
      .then((res) => setResult(res.data))
      .catch(() => setError("Unable to verify this document right now. Please try again later."))
      .finally(() => setLoading(false));
  }, [tenantSlug, referenceNumber]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-5">
        <div className="flex justify-center">
          <Logo size="sm" />
        </div>
        <Card>
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
            Document Verification
          </p>

          {loading && (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          )}

          {!loading && error && <p className="text-center text-sm text-red-600">{error}</p>}

          {!loading && result && (
            <div className="space-y-4 text-center">
              {result.valid ? (
                <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
              ) : (
                <XCircle className="mx-auto h-14 w-14 text-red-500" />
              )}
              <p className={`text-lg font-semibold ${result.valid ? "text-green-700" : "text-red-700"}`}>
                {result.valid ? "This document is valid" : "This document could not be verified"}
              </p>
              <p className="font-mono text-xs text-slate-400">{result.referenceNumber}</p>

              {result.valid && (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-left text-sm">
                  <p>
                    <span className="text-slate-500">Document type:</span> {result.documentTypeName}
                  </p>
                  <p>
                    <span className="text-slate-500">Issued to:</span> {result.issuedToName}
                  </p>
                  <p>
                    <span className="text-slate-500">Issued on:</span> {result.issuedAt?.slice(0, 10)}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
