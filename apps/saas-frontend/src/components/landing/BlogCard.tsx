import { Link } from "react-router-dom";
import { PublicSaasBlogPostListItemDto } from "@hrm-plus/shared";
import { resolveFileUrl } from "../../utils/fileUrl";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BlogCard({ post }: { post: PublicSaasBlogPostListItemDto }) {
  const cover = resolveFileUrl(post.coverImageUrl);
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
        {cover ? (
          <img
            src={cover}
            alt=""
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-brand-50 to-slate-100" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs text-slate-400">
          {[formatDate(post.publishedAt), post.authorName].filter(Boolean).join(" · ")}
        </p>
        <h3 className="mt-2 text-base font-semibold text-slate-900 group-hover:text-brand-700">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{post.excerpt}</p>
        )}
      </div>
    </Link>
  );
}
