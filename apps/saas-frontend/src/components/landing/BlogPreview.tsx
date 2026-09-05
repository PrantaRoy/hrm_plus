import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PublicSaasBlogPostListItemDto, SaasLandingSectionConfig } from "@hrm-plus/shared";
import { listPublicBlogPosts } from "../../api/blog";
import { LandingSection } from "../LandingSection";
import { Reveal } from "../Reveal";
import { BlogCard } from "./BlogCard";

export function BlogPreview({ section }: { section: SaasLandingSectionConfig }) {
  const [posts, setPosts] = useState<PublicSaasBlogPostListItemDto[]>([]);

  useEffect(() => {
    listPublicBlogPosts()
      .then((all) => setPosts(all.slice(0, 3)))
      .catch(() => setPosts([]));
  }, []);

  if (posts.length === 0) return null;

  return (
    <LandingSection id="blog" heading={section.heading} subheading={section.subheading}>
      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((post, index) => (
          <Reveal key={post.id} delay={(index % 3) * 60}>
            <BlogCard post={post} />
          </Reveal>
        ))}
      </div>
      <Link
        to="/blog"
        className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
      >
        View all posts
        <ArrowRight className="h-4 w-4" />
      </Link>
    </LandingSection>
  );
}
