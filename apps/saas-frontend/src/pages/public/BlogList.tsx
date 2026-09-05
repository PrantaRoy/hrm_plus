import { useEffect, useState } from "react";
import { PublicSaasBlogPostListItemDto } from "@hrm-plus/shared";
import { EmptyState, Spinner } from "@hrm-plus/ui";
import { listPublicBlogPosts } from "../../api/blog";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import { setDocumentMeta } from "../../utils/documentMeta";
import { PublicShell } from "../../components/landing/PublicShell";
import { BlogCard } from "../../components/landing/BlogCard";

export default function BlogList() {
  const settings = usePublicSettings();
  const [posts, setPosts] = useState<PublicSaasBlogPostListItemDto[] | null>(null);

  useEffect(() => {
    setDocumentMeta({ title: "Blog — HRM PLUS", description: "Product updates and notes on running better HR." });
    listPublicBlogPosts()
      .then(setPosts)
      .catch(() => setPosts([]));
  }, []);

  if (!settings || posts === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <PublicShell settings={settings}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Blog</h1>
        <p className="mt-3 text-lg text-slate-600">
          Product updates and practical notes on running better HR.
        </p>

        {posts.length === 0 ? (
          <div className="mt-12">
            <EmptyState title="No posts yet" description="Check back soon for updates." />
          </div>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
