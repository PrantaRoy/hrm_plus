import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PublicSaasBlogPostDto } from "@hrm-plus/shared";
import { Spinner } from "@hrm-plus/ui";
import { getPublicBlogPost } from "../../api/blog";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import { setDocumentMeta } from "../../utils/documentMeta";
import { PublicShell } from "../../components/landing/PublicShell";
import { MarkdownContent } from "../../components/MarkdownContent";
import { resolveFileUrl } from "../../utils/fileUrl";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const settings = usePublicSettings();
  const [post, setPost] = useState<PublicSaasBlogPostDto | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setPost(null);
    setNotFound(false);
    getPublicBlogPost(slug)
      .then((p) => {
        setPost(p);
        setDocumentMeta({ title: `${p.title} — HRM PLUS`, description: p.metaDescription ?? p.excerpt });
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  if (!settings) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const cover = resolveFileUrl(post?.coverImageUrl);

  return (
    <PublicShell settings={settings}>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          All posts
        </Link>

        {notFound ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
            <h1 className="text-xl font-semibold text-slate-900">Post not found</h1>
            <p className="mt-2 text-sm text-slate-600">
              This post may have been unpublished or the link is incorrect.
            </p>
          </div>
        ) : !post ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : (
          <>
            <header className="mt-8">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                {post.title}
              </h1>
              <p className="mt-3 text-sm text-slate-400">
                {[formatDate(post.publishedAt), post.authorName].filter(Boolean).join(" · ")}
              </p>
            </header>
            {cover && (
              <img
                src={cover}
                alt=""
                className="mt-8 w-full rounded-2xl border border-slate-200"
              />
            )}
            <MarkdownContent markdown={post.contentMarkdown} className="mt-10" />
          </>
        )}
      </article>
    </PublicShell>
  );
}
