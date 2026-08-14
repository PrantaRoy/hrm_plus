import { Link, useParams } from "react-router-dom";
import { useResolvedTenantSlug } from "../../hooks/useResolvedTenantSlug";
import { useSiteContent } from "../../hooks/useSiteContent";
import { PublicSiteLayout } from "../../components/public-site/PublicSiteLayout";
import { SectionSkeleton } from "../../components/public-site/SectionSkeleton";
import { resolveFileUrl } from "../../utils/fileUrl";

export default function PublicBlogPost() {
  const { slug } = useParams<{ slug: string }>();
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

  const post = content.blogs.find((p) => p.slug === slug);

  return (
    <PublicSiteLayout content={content} tenantSlug={tenantSlug}>
      {!post ? (
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <p className="text-slate-500">Post not found.</p>
          <Link to={`/site/${tenantSlug}`} className="mt-4 inline-block text-brand-600 hover:underline">
            Back to home
          </Link>
        </div>
      ) : (
        <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <Link to={`/site/${tenantSlug}#blogs`} className="text-sm text-brand-600 hover:underline">
            ← Back to blog
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">{post.title}</h1>
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
            <span>{post.authorName ?? "—"}</span>
            {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString()}</span>}
          </div>
          {post.featuredImageUrl && (
            <img
              src={resolveFileUrl(post.featuredImageUrl) ?? undefined}
              alt=""
              className="mt-6 w-full rounded-xl object-cover"
            />
          )}
          <div className="prose prose-slate mt-8 max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>
      )}
    </PublicSiteLayout>
  );
}
