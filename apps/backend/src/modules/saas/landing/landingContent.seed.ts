import { CreateSaasLandingBlockInput } from "@hrm-plus/shared";
import { Prisma } from "../../../../generated/control";
import { controlClient } from "../../../db/controlClient";
import { generateUniqueSlug } from "../../../utils/slug";
import { getOrCreateSettings, updateSaasSiteSettings } from "./saasSiteSettings.service";
import { invalidateLandingCache } from "./saasLandingContent.service";
import {
  SAAS_BLOG_POST_SEED,
  SAAS_FEATURE_HIGHLIGHT_SEEDS,
  SAAS_FEATURE_SEEDS,
  SAAS_PROCESS_STEP_SEEDS,
  SAAS_SITE_SETTINGS_SEED,
  SAAS_STAT_SEEDS,
  SAAS_TESTIMONIAL_SEEDS,
} from "./landingContent.seedData";

const META_KEYS = [
  "bullets",
  "ctaLabel",
  "ctaHref",
  "stepNumber",
  "value",
  "suffix",
  "authorName",
  "authorTitle",
  "company",
  "rating",
] as const;

function toBlockData(input: CreateSaasLandingBlockInput, sortOrder: number): Prisma.SaasLandingBlockCreateInput {
  const meta: Record<string, unknown> = {};
  for (const key of META_KEYS) {
    const value = (input as unknown as Record<string, unknown>)[key];
    if (value !== undefined && value !== null) meta[key] = value;
  }
  return {
    blockType: input.blockType,
    title: input.title,
    subtitle: input.subtitle ?? null,
    body: input.body ?? null,
    icon: input.icon ?? null,
    isActive: input.isActive ?? true,
    sortOrder,
    meta: meta as Prisma.InputJsonValue,
  };
}

async function seedBlockType(seeds: CreateSaasLandingBlockInput[]): Promise<number> {
  if (seeds.length === 0) return 0;
  const existing = await controlClient.saasLandingBlock.count({
    where: { blockType: seeds[0].blockType },
  });
  if (existing > 0) return 0;
  await controlClient.saasLandingBlock.createMany({
    data: seeds.map((seed, index) => toBlockData(seed, index)),
  });
  return seeds.length;
}

/**
 * Seeds default content for the SaaS marketing landing page into the control
 * plane. Idempotent: settings are only seeded when a section layout has not yet
 * been configured; blocks and the welcome blog post are only created when none
 * of that type exist. Never overwrites content an admin has edited.
 */
export async function seedDefaultSaasLandingContent(): Promise<{
  settingsSeeded: boolean;
  blocksCreated: number;
  blogPostCreated: boolean;
}> {
  const settings = await getOrCreateSettings();
  const hasSections = Array.isArray(settings.sections) && settings.sections.length > 0;

  let settingsSeeded = false;
  if (!hasSections) {
    await updateSaasSiteSettings(SAAS_SITE_SETTINGS_SEED);
    settingsSeeded = true;
  }

  let blocksCreated = 0;
  blocksCreated += await seedBlockType(SAAS_FEATURE_HIGHLIGHT_SEEDS);
  blocksCreated += await seedBlockType(SAAS_FEATURE_SEEDS);
  blocksCreated += await seedBlockType(SAAS_PROCESS_STEP_SEEDS);
  blocksCreated += await seedBlockType(SAAS_STAT_SEEDS);
  blocksCreated += await seedBlockType(SAAS_TESTIMONIAL_SEEDS);

  let blogPostCreated = false;
  if ((await controlClient.saasBlogPost.count()) === 0) {
    const slug = await generateUniqueSlug(SAAS_BLOG_POST_SEED.title, "post", async (candidate) =>
      Boolean(await controlClient.saasBlogPost.findUnique({ where: { slug: candidate } }))
    );
    await controlClient.saasBlogPost.create({
      data: {
        title: SAAS_BLOG_POST_SEED.title,
        slug,
        excerpt: SAAS_BLOG_POST_SEED.excerpt,
        contentMarkdown: SAAS_BLOG_POST_SEED.contentMarkdown,
        authorName: SAAS_BLOG_POST_SEED.authorName,
        metaDescription: SAAS_BLOG_POST_SEED.metaDescription,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
    blogPostCreated = true;
  }

  invalidateLandingCache();
  return { settingsSeeded, blocksCreated, blogPostCreated };
}
