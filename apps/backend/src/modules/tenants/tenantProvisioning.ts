import { execFileSync } from "node:child_process";
import path from "node:path";
import bcrypt from "bcrypt";
import mysql from "mysql2/promise";
import { nanoid } from "nanoid";
import { ROLES } from "@hrm-plus/shared";
import { PrismaClient as TenantPrismaClient, User as TenantUser } from "../../../generated/tenant";
import { env } from "../../config/env";
import { createPlaceholderImage } from "../../utils/placeholderImage";
import { SCREENING_QUESTION_SEEDS } from "../screening-questions/screeningQuestion.seedData";
import { getOrCreateSettings, updateSiteSettings } from "../site-settings/siteSetting.service";
import { createHeroSlide } from "../hero-slides/heroSlide.service";
import { createCompanyService } from "../company-services/companyService.service";
import { createGalleryItem } from "../gallery-items/galleryItem.service";
import { createSocialLink } from "../social-links/socialLink.service";
import { createLegalPage } from "../legal-pages/legalPage.service";
import { createBlogPost, publishBlogPost } from "../blog-posts/blogPost.service";
import {
  LANDING_PAGE_ABOUT_SEED,
  LANDING_PAGE_BLOG_POST_SEED,
  LANDING_PAGE_BUSINESS_HOURS,
  LANDING_PAGE_GALLERY_SEEDS,
  LANDING_PAGE_HERO_SEED,
  LANDING_PAGE_LEGAL_PAGE_SEEDS,
  LANDING_PAGE_SERVICE_SEEDS,
  LANDING_PAGE_SOCIAL_LINK_SEEDS,
} from "./landingPageContent.seedData";

async function withAdminConnection<T>(fn: (conn: mysql.Connection) => Promise<T>): Promise<T> {
  const connection = await mysql.createConnection({
    host: env.TENANT_DB_HOST,
    port: Number(env.TENANT_DB_PORT),
    user: env.TENANT_DB_USER,
    password: env.TENANT_DB_PASSWORD,
  });
  try {
    return await fn(connection);
  } finally {
    await connection.end();
  }
}

export async function createTenantDatabase(databaseName: string): Promise<void> {
  await withAdminConnection((conn) => conn.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``) as any);
}

export async function dropTenantDatabase(databaseName: string): Promise<void> {
  await withAdminConnection((conn) => conn.query(`DROP DATABASE IF EXISTS \`${databaseName}\``) as any);
}

export function runTenantMigrations(databaseUrl: string): void {
  const schemaPath = path.join(__dirname, "..", "..", "..", "prisma", "tenant", "schema.prisma");
  execFileSync("npx", ["prisma", "migrate", "deploy", `--schema=${schemaPath}`], {
    stdio: "inherit",
    env: { ...process.env, TENANT_MIGRATION_DATABASE_URL: databaseUrl },
  });
}

export async function seedDefaultRoles(
  tenantClient: TenantPrismaClient
): Promise<Record<(typeof ROLES)[number], number>> {
  const records = await Promise.all(
    ROLES.map((roleName) =>
      tenantClient.role.upsert({
        where: { name: roleName },
        update: {},
        create: { name: roleName },
      })
    )
  );

  return Object.fromEntries(records.map((r) => [r.name, r.id])) as Record<
    (typeof ROLES)[number],
    number
  >;
}

const WEEK_DAYS: Array<{ name: string; isWeekend: boolean }> = [
  { name: "Sunday", isWeekend: true },
  { name: "Monday", isWeekend: false },
  { name: "Tuesday", isWeekend: false },
  { name: "Wednesday", isWeekend: false },
  { name: "Thursday", isWeekend: false },
  { name: "Friday", isWeekend: false },
  { name: "Saturday", isWeekend: true },
];

export async function seedDefaultWeekDays(tenantClient: TenantPrismaClient): Promise<void> {
  const existing = await tenantClient.weekDay.count();
  if (existing > 0) {
    return;
  }
  await tenantClient.weekDay.createMany({ data: WEEK_DAYS });
}

const DOCUMENT_CATEGORIES: Array<{ code: string; name: string }> = [
  { code: "SALARY_CERT", name: "Salary Certificate" },
  { code: "PAYSLIP", name: "Payslip" },
  { code: "EXP_LETTER", name: "Experience Letter" },
  { code: "APPOINT_LETTER", name: "Appointment Letter" },
  { code: "LEAVE_APPROVAL", name: "Leave Approval Letter" },
  { code: "APPRECIATION_LETTER", name: "Appreciation Letter" },
  { code: "SALARY_INCREMENT", name: "Salary Increment Letter" },
  { code: "AWARD_LETTER", name: "Award Letter" },
  { code: "ASSET_RECEIPT", name: "Asset Receipt Acknowledgement" },
  { code: "ASSET_RETURN", name: "Asset Return Checklist" },
];

/**
 * Kept in sync with the seed INSERT embedded in migration
 * `20260805125453_add_document_builder/migration.sql` (which is what actually
 * seeds already-provisioned tenants when their migrations run). This helper
 * exists for new-tenant provisioning parity and test setup.
 */
export async function seedDefaultDocumentCategories(tenantClient: TenantPrismaClient): Promise<void> {
  await Promise.all(
    DOCUMENT_CATEGORIES.map((category) =>
      tenantClient.documentCategory.upsert({
        where: { code: category.code },
        update: { name: category.name },
        create: category,
      })
    )
  );
}

/**
 * Idempotently seeds the NZ/AU legal-compliance screening question bank (upsert by
 * `code`) so every provisioned tenant has them available to attach to job circulars
 * out of the box. Safe to re-run — matches the shape of `seedDefaultDocumentCategories`.
 */
export async function seedDefaultScreeningQuestions(tenantClient: TenantPrismaClient): Promise<void> {
  await Promise.all(
    SCREENING_QUESTION_SEEDS.map((seed) =>
      tenantClient.screeningQuestion.upsert({
        where: { code: seed.code },
        update: { text: seed.text, type: seed.type, options: seed.options ?? undefined, category: seed.category },
        create: {
          code: seed.code,
          text: seed.text,
          type: seed.type,
          options: seed.options ?? undefined,
          category: seed.category,
          isSystem: true,
        },
      })
    )
  );
}

const DEFAULT_SITE_SECTIONS: { sectionKey: string; displayName: string }[] = [
  { sectionKey: "hero", displayName: "Hero" },
  { sectionKey: "about", displayName: "About Us" },
  { sectionKey: "overview", displayName: "Our Services" },
  { sectionKey: "gallery", displayName: "Gallery" },
  { sectionKey: "careers", displayName: "Careers" },
  { sectionKey: "blogs", displayName: "Blog" },
  { sectionKey: "contact", displayName: "Contact Us" },
];

/**
 * Idempotently seeds the default public-website CMS section list. Existing tenants
 * also get these lazily via siteSection.service.listSections, so this is just a
 * convenience for freshly-provisioned tenants — matches seedDefaultWeekDays's shape.
 */
export async function seedDefaultSiteSections(tenantClient: TenantPrismaClient): Promise<void> {
  const existing = await tenantClient.siteSection.count();
  if (existing > 0) {
    return;
  }
  await tenantClient.siteSection.createMany({
    data: DEFAULT_SITE_SECTIONS.map((section, index) => ({
      sectionKey: section.sectionKey,
      displayName: section.displayName,
      isEnabled: true,
      sortOrder: index,
    })),
  });
}

/**
 * Idempotently seeds starter content for a tenant's public landing page (hero
 * slide, services, gallery, about/contact copy, social links, legal pages, one
 * published blog post) so a freshly-provisioned tenant's site isn't empty
 * before an admin customizes it. Each entity type is checked independently and
 * only seeded if that table is still empty, so this is safe to re-run against
 * a tenant that has already added some of their own content — existing content
 * is never touched or overwritten. Placeholder hero/gallery images are
 * generated locally (see utils/placeholderImage.ts), tinted with the tenant's
 * own brand colors, rather than fabricated or fetched from the network.
 */
export async function seedDefaultLandingPageContent(
  tenantClient: TenantPrismaClient,
  admin: { id: number; email: string },
  companyName: string
): Promise<void> {
  const settings = await getOrCreateSettings(tenantClient);
  if (!settings.aboutContent) {
    await updateSiteSettings(
      tenantClient,
      {
        siteTitle: companyName,
        tagline: "Building better ways to work, together.",
        contactEmail: admin.email,
        businessHours: LANDING_PAGE_BUSINESS_HOURS,
        aboutHeading: LANDING_PAGE_ABOUT_SEED.heading,
        aboutContent: LANDING_PAGE_ABOUT_SEED.content,
        metaDescription: LANDING_PAGE_ABOUT_SEED.metaDescription,
      },
      admin.id
    );
  }

  // Re-fetch in case the update above just set the brand colors for the first time.
  const { primaryColor, secondaryColor } = await getOrCreateSettings(tenantClient);

  if ((await tenantClient.heroSlide.count()) === 0) {
    const heroImage = createPlaceholderImage(1200, 1500, primaryColor);
    await createHeroSlide(
      tenantClient,
      {
        headline: LANDING_PAGE_HERO_SEED.headline,
        subHeadline: LANDING_PAGE_HERO_SEED.subHeadline,
        mediaType: "IMAGE",
        ctaPrimaryText: LANDING_PAGE_HERO_SEED.ctaPrimaryText,
        ctaPrimaryUrl: LANDING_PAGE_HERO_SEED.ctaPrimaryUrl,
        ctaSecondaryText: LANDING_PAGE_HERO_SEED.ctaSecondaryText,
        ctaSecondaryUrl: LANDING_PAGE_HERO_SEED.ctaSecondaryUrl,
      },
      { buffer: heroImage, originalName: "hero-placeholder.png", mimeType: "image/png" }
    );
  }

  if ((await tenantClient.companyService.count()) === 0) {
    for (const service of LANDING_PAGE_SERVICE_SEEDS) {
      await createCompanyService(tenantClient, service);
    }
  }

  if ((await tenantClient.galleryItem.count()) === 0) {
    for (const item of LANDING_PAGE_GALLERY_SEEDS) {
      const color = item.tone === "primary" ? primaryColor : secondaryColor;
      const image = createPlaceholderImage(800, 800, color);
      await createGalleryItem(
        tenantClient,
        { title: item.title, category: item.category },
        { buffer: image, originalName: "gallery-placeholder.png", mimeType: "image/png" }
      );
    }
  }

  if ((await tenantClient.socialLink.count()) === 0) {
    for (const link of LANDING_PAGE_SOCIAL_LINK_SEEDS) {
      await createSocialLink(tenantClient, link);
    }
  }

  for (const page of LANDING_PAGE_LEGAL_PAGE_SEEDS) {
    const existingPage = await tenantClient.legalPage.findUnique({ where: { slug: page.slug } });
    if (!existingPage) {
      await createLegalPage(tenantClient, page);
    }
  }

  if ((await tenantClient.blogPost.count()) === 0) {
    const post = await createBlogPost(tenantClient, LANDING_PAGE_BLOG_POST_SEED, admin.id);
    await publishBlogPost(tenantClient, post.id, admin.id);
  }
}

/**
 * Idempotently ensures a tenant admin user (+ linked employee) exists with the
 * given plaintext password. Re-running this always resets the password back
 * to `params.password` instead of leaving behind a previously-generated one.
 */
export async function provisionTenantAdmin(
  tenantClient: TenantPrismaClient,
  params: { email: string; password: string; roleId: number }
): Promise<TenantUser> {
  const passwordHash = await bcrypt.hash(params.password, 10);

  const adminUser = await tenantClient.user.upsert({
    where: { email: params.email },
    update: { passwordHash, roleId: params.roleId, mustChangePassword: false },
    create: { email: params.email, passwordHash, roleId: params.roleId },
  });

  await tenantClient.employee.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      employeeCode: `EMP-${nanoid(6).toUpperCase()}`,
      firstName: "Tenant",
      lastName: "Admin",
      email: params.email,
      joiningDate: new Date(),
      userId: adminUser.id,
    },
  });

  return adminUser;
}
