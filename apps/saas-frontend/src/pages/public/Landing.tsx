import { ReactNode, useEffect, useState } from "react";
import {
  SAAS_LANDING_SECTION_KEYS,
  SaasLandingContentDto,
  SaasLandingSectionConfig,
} from "@hrm-plus/shared";
import { Spinner } from "@hrm-plus/ui";
import { getLandingContent } from "../../api/landing";
import { setDocumentMeta } from "../../utils/documentMeta";
import { PublicShell } from "../../components/landing/PublicShell";
import { LandingHero } from "../../components/landing/LandingHero";
import { FeatureHighlights } from "../../components/landing/FeatureHighlights";
import { FeatureGrid } from "../../components/landing/FeatureGrid";
import { ProcessSteps } from "../../components/landing/ProcessSteps";
import { StatsBand } from "../../components/landing/StatsBand";
import { Testimonials } from "../../components/landing/Testimonials";
import { Pricing } from "../../components/landing/Pricing";
import { BlogPreview } from "../../components/landing/BlogPreview";
import { ContactSection } from "../../components/landing/ContactSection";
import { CtaBand } from "../../components/landing/CtaBand";

const SECTION_LABELS: Record<string, string> = {
  "feature-highlights": "Feature highlights",
  features: "Features",
  process: "How it works",
  stats: "Stats",
  testimonials: "Testimonials",
  pricing: "Pricing",
  blog: "Blog",
  contact: "Contact",
};

function resolveSections(configured: SaasLandingSectionConfig[]): SaasLandingSectionConfig[] {
  if (configured.length > 0) {
    return [...configured].filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  }
  return SAAS_LANDING_SECTION_KEYS.map((key, index) => ({
    key,
    label: SECTION_LABELS[key] ?? key,
    heading: null,
    subheading: null,
    enabled: true,
    order: index,
  }));
}

export default function Landing() {
  const [content, setContent] = useState<SaasLandingContentDto | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getLandingContent()
      .then(setContent)
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    if (!content) return;
    setDocumentMeta({
      title: content.settings.metaTitle ?? `${content.settings.siteName} — ${content.settings.heroHeadline}`,
      description: content.settings.metaDescription,
    });
  }, [content]);

  if (failed) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-slate-500">
        This page is not available right now. Please try again later.
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const { settings } = content;
  const sections = resolveSections(settings.sections);

  const renderers: Record<string, (section: SaasLandingSectionConfig) => ReactNode> = {
    "feature-highlights": (section) => (
      <FeatureHighlights section={section} blocks={content.featureHighlights} />
    ),
    features: (section) => <FeatureGrid section={section} blocks={content.features} />,
    process: (section) => <ProcessSteps section={section} blocks={content.processSteps} />,
    stats: (section) => <StatsBand section={section} blocks={content.stats} />,
    testimonials: (section) => <Testimonials section={section} blocks={content.testimonials} />,
    pricing: (section) => <Pricing section={section} packages={content.packages} />,
    blog: (section) => <BlogPreview section={section} />,
    contact: (section) => <ContactSection section={section} settings={settings} />,
  };

  return (
    <PublicShell settings={settings}>
      <LandingHero settings={settings} />
      {sections.map((section) => {
        const render = renderers[section.key];
        return render ? <div key={section.key}>{render(section)}</div> : null;
      })}
      <CtaBand settings={settings} />
    </PublicShell>
  );
}
