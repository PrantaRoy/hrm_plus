import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { TENANT_HEADER } from "@hrm-plus/shared";
import type { CandidatePortalRedeemResponse } from "@hrm-plus/shared";
import { Badge, Button, Card, Logo, Spinner } from "@hrm-plus/ui";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export default function CandidatePortal() {
  const { tenantSlug } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [data, setData] = useState<CandidatePortalRedeemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  function headers() {
    return { [TENANT_HEADER]: tenantSlug ?? "", "X-Candidate-Token": token ?? "" };
  }

  function refresh() {
    if (!tenantSlug || !token) return;
    setLoading(true);
    axios
      .get<CandidatePortalRedeemResponse>(`${baseURL}/public/candidate-portal/me`, { headers: headers() })
      .then((res) => setData(res.data))
      .catch(() => setError("This link is invalid or has expired."))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [tenantSlug, token]);

  async function handleWithdraw() {
    if (!window.confirm("Withdraw your application? This cannot be undone.")) return;
    setWithdrawing(true);
    try {
      await axios.post(`${baseURL}/public/candidate-portal/withdraw`, {}, { headers: headers() });
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to withdraw application.");
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-5">
        <div className="flex justify-center">
          <Logo size="sm" />
        </div>
        <Card title="Your Application">
          {loading && (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          )}
          {!loading && error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && data && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Hi {data.candidateName},</p>
              <div>
                <p className="text-xs text-slate-400">Position</p>
                <p className="text-sm font-medium text-slate-900">{data.application.jobTitle}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Status</p>
                <Badge color={data.application.withdrawnAt ? "slate" : "brand"}>
                  {data.application.withdrawnAt ? "Withdrawn" : data.application.stage.replace(/_/g, " ")}
                </Badge>
              </div>

              {data.application.hasAssessmentInvitation && !data.application.withdrawnAt && (
                <Link
                  to={`/candidate/${tenantSlug}/assessment?token=${token}`}
                  className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  {data.application.assessmentStatus === "GRADED" ? "View Assessment" : "Complete Assessment"}
                </Link>
              )}

              {!data.application.withdrawnAt && data.application.stage !== "HIRED" && (
                <Button variant="danger" isLoading={withdrawing} onClick={handleWithdraw}>
                  Withdraw Application
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
