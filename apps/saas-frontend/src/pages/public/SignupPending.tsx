import { Link, useLocation } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { Card } from "@hrm-plus/ui";

export default function SignupPending() {
  const location = useLocation();
  const companyName = (location.state as { companyName?: string } | null)?.companyName;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <Card className="max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <MailCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Application received</h1>
        <p className="mt-3 text-slate-600">
          {companyName ? <>Thanks, {companyName}! </> : null}
          Your information is pending approval. While it's being reviewed we'll notify you by email —
          keep an eye on your inbox.
        </p>
        <Link to="/" className="mt-6 inline-block text-brand-600 font-medium underline">
          Back to home
        </Link>
      </Card>
    </div>
  );
}
