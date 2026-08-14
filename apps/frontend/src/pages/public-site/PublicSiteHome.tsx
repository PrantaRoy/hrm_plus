import { ReactElement } from "react";
import { SiteSectionKey } from "@hrm-plus/shared";
import { useResolvedTenantSlug } from "../../hooks/useResolvedTenantSlug";
import { useSiteContent } from "../../hooks/useSiteContent";
import { PublicSiteLayout } from "../../components/public-site/PublicSiteLayout";
import { SectionSkeleton } from "../../components/public-site/SectionSkeleton";
import { HeroSection } from "../../components/public-site/HeroSection";
import { AboutSection } from "../../components/public-site/AboutSection";
import { OverviewSection } from "../../components/public-site/OverviewSection";
import { GallerySection } from "../../components/public-site/GallerySection";
import { CareersSection } from "../../components/public-site/CareersSection";
import { BlogsSection } from "../../components/public-site/BlogsSection";
import { ContactSection } from "../../components/public-site/ContactSection";

export default function PublicSiteHome() {
  const tenantSlug = useResolvedTenantSlug();
  const { data: content, isLoading, isError } = useSiteContent(tenantSlug);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    );
  }

  if (isError || !content || !tenantSlug) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        This website is not available.
      </div>
    );
  }

  const sectionRenderers: Partial<Record<SiteSectionKey, () => ReactElement | null>> = {
    hero: () => <HeroSection data={content.heroSlides} />,
    about: () => <AboutSection data={content.siteSettings} />,
    overview: () => <OverviewSection data={content.services} />,
    gallery: () => <GallerySection data={content.gallery} />,
    careers: () => <CareersSection data={content.jobs} tenantSlug={tenantSlug} />,
    blogs: () => <BlogsSection data={content.blogs} tenantSlug={tenantSlug} />,
    contact: () => <ContactSection tenantSlug={tenantSlug} siteSettings={content.siteSettings} />,
  };

  return (
    <PublicSiteLayout content={content} tenantSlug={tenantSlug}>
      {[...content.sections]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((section) => {
          const render = sectionRenderers[section.sectionKey];
          return render ? <div key={section.id}>{render()}</div> : null;
        })}
    </PublicSiteLayout>
  );
}
