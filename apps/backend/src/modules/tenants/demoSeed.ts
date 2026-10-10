import { PrismaClient as TenantPrismaClient } from "../../../generated/tenant";
import { createPlaceholderImage } from "../../utils/placeholderImage";
import { createDepartment } from "../departments/department.service";
import { createDesignation } from "../designations/designation.service";
import { createLeaveType } from "../leave-types/leaveType.service";
import { createShift } from "../shifts/shift.service";
import { createAsset } from "../assets/asset.service";
import { createHeroSlide } from "../hero-slides/heroSlide.service";
import { createCompanyService } from "../company-services/companyService.service";
import { createBlogPost, publishBlogPost } from "../blog-posts/blogPost.service";
import { getOrCreateSettings } from "../site-settings/siteSetting.service";
import {
  seedDefaultLandingPageContent,
  seedDefaultSiteSections,
  seedDefaultWeekDays,
} from "./tenantProvisioning";
import {
  DEMO_ASSETS,
  DEMO_BLOG_POSTS,
  DEMO_DEPARTMENTS,
  DEMO_DESIGNATIONS,
  DEMO_HERO_SLIDES,
  DEMO_LEAVE_TYPES,
  DEMO_SERVICES,
  DEMO_SHIFTS,
} from "./demoSeed.data";

/**
 * Seeds sample organisation structure, website content and assets into a freshly
 * provisioned tenant. Each entity type is only seeded while its table is empty,
 * so it is safe to re-run and never touches content a tenant already has.
 */
export async function seedDemoOrgData(
  tc: TenantPrismaClient,
  admin: { id: number; email: string },
  companyName: string
): Promise<void> {
  await seedDefaultWeekDays(tc);
  await seedDefaultSiteSections(tc);

  if ((await tc.department.count()) === 0) {
    for (const name of DEMO_DEPARTMENTS) await createDepartment(tc, { name });
  }
  if ((await tc.designation.count()) === 0) {
    for (const name of DEMO_DESIGNATIONS) await createDesignation(tc, { name });
  }
  if ((await tc.leaveType.count()) === 0) {
    for (const leaveType of DEMO_LEAVE_TYPES) await createLeaveType(tc, leaveType);
  }
  if ((await tc.shift.count()) === 0) {
    for (const shift of DEMO_SHIFTS) await createShift(tc, shift);
  }
  if ((await tc.asset.count()) === 0) {
    for (const asset of DEMO_ASSETS) await createAsset(tc, asset, admin.id);
  }

  const { primaryColor, secondaryColor } = await getOrCreateSettings(tc);

  if ((await tc.heroSlide.count()) === 0) {
    for (const { tone, ...slide } of DEMO_HERO_SLIDES) {
      const image = createPlaceholderImage(1200, 1500, tone === "primary" ? primaryColor : secondaryColor);
      await createHeroSlide(
        tc,
        { ...slide, mediaType: "IMAGE" },
        { buffer: image, originalName: "hero-placeholder.png", mimeType: "image/png" }
      );
    }
  }
  if ((await tc.companyService.count()) === 0) {
    for (const service of DEMO_SERVICES) await createCompanyService(tc, service);
  }
  if ((await tc.blogPost.count()) === 0) {
    for (const post of DEMO_BLOG_POSTS) {
      const created = await createBlogPost(tc, post, admin.id);
      await publishBlogPost(tc, created.id, admin.id);
    }
  }

  // Fills in the remaining landing-page pieces (about/contact, gallery, social, legal);
  // hero/services/blogs are skipped above because those tables are no longer empty.
  await seedDefaultLandingPageContent(tc, admin, companyName);
}
