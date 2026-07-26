import { Link, useLocation } from "react-router-dom";

export default function SignupPending() {
  const location = useLocation();
  const companyName = (location.state as { companyName?: string } | null)?.companyName;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-md text-center bg-white border border-slate-200 rounded-lg p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Application received</h1>
        <p className="mt-4 text-slate-600">
          {companyName ? <>Thanks, {companyName}! </> : null}
          Your information is pending approval. While it's being reviewed we'll notify you by email —
          keep an eye on your inbox.
        </p>
        <Link to="/" className="mt-6 inline-block text-slate-900 font-medium underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
