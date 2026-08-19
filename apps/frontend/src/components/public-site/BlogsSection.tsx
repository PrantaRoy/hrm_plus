import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { PublicBlogPostDto } from "@hrm-plus/shared";
import { resolveFileUrl } from "../../utils/fileUrl";
import { EYEBROW_LABEL } from "./decor/publicSiteClasses";

export function BlogsSection({ data, tenantSlug }: { data: PublicBlogPostDto[]; tenantSlug: string }) {
  if (data.length === 0) return null;

  return (
    <section id="blogs" className="bg-[var(--brand-primary-tint)] py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <span className={EYEBROW_LABEL}>Resources</span>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">From the Blog</h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((post, i) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link
                to={`/site/${tenantSlug}/blog/${post.slug}`}
                className="block overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                {post.featuredImageUrl && (
                  <img
                    src={resolveFileUrl(post.featuredImageUrl) ?? undefined}
                    alt=""
                    className="h-44 w-full object-cover"
                  />
                )}
                <div className="p-5">
                  <h3 className="font-semibold text-slate-900">{post.title}</h3>
                  {post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-slate-500">{post.excerpt}</p>}
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span>{post.authorName ?? "—"}</span>
                    {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString()}</span>}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
