import { PublicJobListItemDto } from "./job";
import { PublicSiteSettingDto } from "./cmsSiteSettings";
import { SiteSectionDto } from "./cmsSection";
import { PublicHeroSlideDto } from "./heroSlide";
import { PublicCompanyServiceDto } from "./companyService";
import { PublicGalleryItemDto } from "./galleryItem";
import { PublicBlogPostDto } from "./blogPost";
import { PublicSocialLinkDto } from "./socialLink";
import { PublicLegalPageDto } from "./legalPage";

export interface PublicSiteContentDto {
  siteSettings: PublicSiteSettingDto;
  sections: SiteSectionDto[];
  heroSlides: PublicHeroSlideDto[];
  services: PublicCompanyServiceDto[];
  gallery: PublicGalleryItemDto[];
  jobs: PublicJobListItemDto[];
  blogs: PublicBlogPostDto[];
  socialLinks: PublicSocialLinkDto[];
  legalPages: PublicLegalPageDto[];
}
