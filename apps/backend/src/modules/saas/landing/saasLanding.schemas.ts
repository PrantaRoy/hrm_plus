import { z } from "zod";
import { SAAS_LANDING_BLOCK_TYPES } from "@hrm-plus/shared";

const navLinkSchema = z.object({
  label: z.string().trim().min(1).max(60),
  href: z.string().trim().min(1).max(300),
});

const footerColumnSchema = z.object({
  title: z.string().trim().min(1).max(60),
  links: z.array(navLinkSchema).max(20),
});

const socialLinkSchema = z.object({
  platform: z.string().trim().min(1).max(40),
  icon: z.string().trim().min(1).max(40),
  url: z.string().trim().url().max(300),
});

const sectionConfigSchema = z.object({
  key: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(60),
  heading: z.string().trim().max(160).nullable(),
  subheading: z.string().trim().max(400).nullable(),
  enabled: z.boolean(),
  order: z.number().int().min(0).max(99),
});

const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();

export const updateSaasSiteSettingsSchema = z.object({
  siteName: z.string().trim().min(1).max(120).optional(),
  navLinks: z.array(navLinkSchema).max(12).optional(),
  headerCtaLabel: z.string().trim().min(1).max(60).optional(),
  headerCtaHref: z.string().trim().min(1).max(300).optional(),
  loginUrl: z.string().trim().min(1).max(300).optional(),
  heroEyebrow: nullableText(120),
  heroHeadline: z.string().trim().min(1).max(200).optional(),
  heroSubheadline: nullableText(600),
  heroPrimaryCtaLabel: nullableText(60),
  heroPrimaryCtaHref: nullableText(300),
  heroSecondaryCtaLabel: nullableText(60),
  heroSecondaryCtaHref: nullableText(300),
  sections: z.array(sectionConfigSchema).max(20).optional(),
  ctaHeading: nullableText(160),
  ctaSubheading: nullableText(600),
  ctaButtonLabel: nullableText(60),
  ctaButtonHref: nullableText(300),
  contactHeading: nullableText(160),
  contactSubheading: nullableText(600),
  contactEmail: z.string().trim().email().max(160).nullable().optional(),
  contactPhone: nullableText(40),
  contactAddress: nullableText(2000),
  footerTagline: nullableText(400),
  footerColumns: z.array(footerColumnSchema).max(6).optional(),
  socialLinks: z.array(socialLinkSchema).max(12).optional(),
  footerLegalText: nullableText(300),
  metaTitle: nullableText(200),
  metaDescription: nullableText(500),
});

export const saasSettingsImageFieldSchema = z.enum([
  "logo",
  "favicon",
  "heroImage",
  "ogImage",
]);
export type SaasSettingsImageField = z.infer<typeof saasSettingsImageFieldSchema>;

const bulletsSchema = z.array(z.string().trim().min(1).max(200)).max(10);

export const createSaasLandingBlockSchema = z.object({
  blockType: z.enum(SAAS_LANDING_BLOCK_TYPES),
  title: z.string().trim().min(1).max(200),
  subtitle: z.string().trim().max(2000).nullable().optional(),
  body: z.string().trim().max(4000).nullable().optional(),
  icon: z.string().trim().max(40).nullable().optional(),
  isActive: z.boolean().optional(),
  bullets: bulletsSchema.optional(),
  ctaLabel: z.string().trim().max(60).nullable().optional(),
  ctaHref: z.string().trim().max(300).nullable().optional(),
  stepNumber: z.number().int().min(1).max(99).nullable().optional(),
  value: z.string().trim().max(40).nullable().optional(),
  suffix: z.string().trim().max(20).nullable().optional(),
  authorName: z.string().trim().max(120).nullable().optional(),
  authorTitle: z.string().trim().max(160).nullable().optional(),
  company: z.string().trim().max(120).nullable().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
});

export const updateSaasLandingBlockSchema = createSaasLandingBlockSchema
  .omit({ blockType: true })
  .partial();

export const reorderSaasLandingBlocksSchema = z.object({
  blockType: z.enum(SAAS_LANDING_BLOCK_TYPES),
  orderedIds: z.array(z.number().int().positive()).min(1),
});

export const listSaasLandingBlocksQuerySchema = z.object({
  blockType: z.enum(SAAS_LANDING_BLOCK_TYPES).optional(),
});
