import { PrismaClient } from "../../../generated/tenant";
import { PublicSiteContentDto } from "@hrm-plus/shared";
import { createTtlCache } from "../../utils/ttlCache";
import { getOrCreateSettings as getOrCreateSiteSettings } from "../site-settings/siteSetting.service";
import { toPublicSiteSettingDto } from "../site-settings/siteSetting.mapper";
import { listSections } from "../site-sections/siteSection.service";
import { toPublicHeroSlideDto } from "../hero-slides/heroSlide.mapper";
import { toPublicCompanyServiceDto } from "../company-services/companyService.mapper";
import { toPublicGalleryItemDto } from "../gallery-items/galleryItem.mapper";
import { toPublicBlogPostDto } from "../blog-posts/blogPost.mapper";
import { toPublicSocialLinkDto } from "../social-links/socialLink.mapper";
import { toPublicLegalPageDto } from "../legal-pages/legalPage.mapper";
import { listJobs } from "../jobs/job.service";
import { toPublicJobListItem } from "../jobs/job.mapper";

const cache = createTtlCache<PublicSiteContentDto>(60_000);

async function buildSiteContent(prisma: PrismaClient): Promise<PublicSiteContentDto> {
  const [siteSettings, sections, heroSlides, services, gallery, jobs, blogs, socialLinks, legalPages] =
    await Promise.all([
      getOrCreateSiteSettings(prisma),
      listSections(prisma),
      prisma.heroSlide.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.companyService.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.galleryItem.findMany({ orderBy: { sortOrder: "asc" }, take: 60 }),
      listJobs(prisma, { status: "Open" }),
      prisma.blogPost.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" } }),
      prisma.socialLink.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.legalPage.findMany(),
    ]);

  return {
    siteSettings: toPublicSiteSettingDto(siteSettings),
    sections: sections.filter((section) => section.isEnabled),
    heroSlides: heroSlides.map(toPublicHeroSlideDto),
    services: services.map(toPublicCompanyServiceDto),
    gallery: gallery.map(toPublicGalleryItemDto),
    jobs: jobs.map(toPublicJobListItem),
    blogs: blogs.map(toPublicBlogPostDto),
    socialLinks: socialLinks.map(toPublicSocialLinkDto),
    legalPages: legalPages.map(toPublicLegalPageDto),
  };
}

export async function getSiteContent(prisma: PrismaClient, tenantId: number): Promise<PublicSiteContentDto> {
  const cacheKey = String(tenantId);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const content = await buildSiteContent(prisma);
  cache.set(cacheKey, content);
  return content;
}
