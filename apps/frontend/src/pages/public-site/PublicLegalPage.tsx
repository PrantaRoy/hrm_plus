import { Link, useParams } from "react-router-dom";
import { useResolvedTenantSlug } from "../../hooks/useResolvedTenantSlug";
import { useSiteContent } from "../../hooks/useSiteContent";
import { PublicSiteLayout } from "../../components/public-site/PublicSiteLayout";
import { SectionSkeleton } from "../../components/public-site/SectionSkeleton";

export default function PublicLegalPage() {
  const { legalSlug } = useParams<{ legalSlug: string }>();
  const tenantSlug = useResolvedTenantSlug();
  const { data: content, isLoading, isError } = useSiteContent(tenantSlug);

  if (isLoading) return <SectionSkeleton />;

  if (isError || !content || !tenantSlug) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        This website is not available.
      </div>
    );
  }

  const page = content.legalPages.find((p) => p.slug === legalSlug);

  return (
    <PublicSiteLayout content={content} tenantSlug={tenantSlug}>
      {!page ? (
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <p className="text-slate-500">Page not found.</p>
          <Link to={`/site/${tenantSlug}`} className="mt-4 inline-block text-brand-600 hover:underline">
            Back to home
          </Link>
        </div>
      ) : (
        <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h1 className="text-3xl font-bold text-slate-900">{page.title}</h1>
          <div className="prose prose-slate mt-8 max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
        </article>
      )}
    </PublicSiteLayout>
  );
}
