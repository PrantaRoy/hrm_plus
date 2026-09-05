import { SaasLandingContentDto } from "@hrm-plus/shared";
import { controlClient } from "../../../db/controlClient";
import { createTtlCache } from "../../../utils/ttlCache";
import { toPackageDto } from "../packages/package.mapper";
import { getOrCreateSettings } from "./saasSiteSettings.service";
import { toPublicSaasLandingBlockDto, toPublicSaasSiteSettingsDto } from "./saasLanding.mapper";

const CACHE_KEY = "global";
const cache = createTtlCache<SaasLandingContentDto>(60_000);

export function invalidateLandingCache(): void {
  cache.clear();
}

async function buildLandingContent(): Promise<SaasLandingContentDto> {
  const [settings, blocks, packages] = await Promise.all([
    getOrCreateSettings(),
    controlClient.saasLandingBlock.findMany({
      where: { isActive: true },
      orderBy: [{ blockType: "asc" }, { sortOrder: "asc" }],
    }),
    controlClient.package.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const byType = (type: string) =>
    blocks.filter((b) => b.blockType === type).map(toPublicSaasLandingBlockDto);

  return {
    settings: toPublicSaasSiteSettingsDto(settings),
    featureHighlights: byType("FEATURE_HIGHLIGHT"),
    features: byType("FEATURE"),
    processSteps: byType("PROCESS_STEP"),
    stats: byType("STAT"),
    testimonials: byType("TESTIMONIAL"),
    packages: packages.map(toPackageDto),
  };
}

export async function getSaasLandingContent(): Promise<SaasLandingContentDto> {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;
  const content = await buildLandingContent();
  cache.set(CACHE_KEY, content);
  return content;
}
