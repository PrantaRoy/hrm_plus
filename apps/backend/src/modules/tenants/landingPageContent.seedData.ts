import { BusinessHourEntry } from "@hrm-plus/shared";

// Deliberately generic, business-agnostic copy — every tenant is a different
// company, so this is a starting template an admin is expected to replace,
// not a claim about any specific business. No fabricated stats/testimonials.

export const LANDING_PAGE_HERO_SEED = {
  headline: "Grow Your Business With Confidence",
  subHeadline:
    "We help teams plan, launch, and scale — with the tools and support you need at every step of the way.",
  ctaPrimaryText: "Get Started",
  ctaPrimaryUrl: "#contact",
  ctaSecondaryText: "Learn More",
  ctaSecondaryUrl: "#overview",
};

export interface LandingPageServiceSeed {
  icon: string;
  title: string;
  summary: string;
  description: string;
}

export const LANDING_PAGE_SERVICE_SEEDS: LandingPageServiceSeed[] = [
  {
    icon: "Rocket",
    title: "Strategy & Planning",
    summary: "Set a clear direction with a plan built around your goals.",
    description:
      "<p>We work closely with you to understand where you want to go, then map out a practical, step-by-step plan to get there — with clear milestones along the way.</p>",
  },
  {
    icon: "Users",
    title: "Team Growth",
    summary: "Build and support a team that helps you scale.",
    description:
      "<p>From hiring to onboarding to ongoing development, we help you build a team that's set up to succeed — today and as you grow.</p>",
  },
  {
    icon: "TrendingUp",
    title: "Operations & Support",
    summary: "Keep things running smoothly with reliable, ongoing support.",
    description:
      "<p>Our team is here to help you stay on track, solve problems quickly, and keep your day-to-day operations running smoothly.</p>",
  },
];

export interface LandingPageGalleryItemSeed {
  title: string;
  category: string;
  tone: "primary" | "secondary";
}

export const LANDING_PAGE_GALLERY_SEEDS: LandingPageGalleryItemSeed[] = [
  { title: "Our Workspace", category: "Office", tone: "primary" },
  { title: "Team Offsite", category: "Events", tone: "secondary" },
  { title: "Product Launch", category: "Events", tone: "primary" },
  { title: "Behind the Scenes", category: "Office", tone: "secondary" },
];

export interface LandingPageSocialLinkSeed {
  platform: string;
  icon: string;
  url: string;
}

// Placeholder profile URLs — clearly templated ("your-company"), meant to be
// replaced with real profiles, not presented as verified/real links.
export const LANDING_PAGE_SOCIAL_LINK_SEEDS: LandingPageSocialLinkSeed[] = [
  { platform: "LinkedIn", icon: "Linkedin", url: "https://linkedin.com/company/your-company" },
  { platform: "Facebook", icon: "Facebook", url: "https://facebook.com/yourcompany" },
  { platform: "Instagram", icon: "Instagram", url: "https://instagram.com/yourcompany" },
];

export interface LandingPageLegalPageSeed {
  slug: string;
  title: string;
  content: string;
}

export const LANDING_PAGE_LEGAL_PAGE_SEEDS: LandingPageLegalPageSeed[] = [
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    content:
      "<p>This is a placeholder privacy policy. Replace this content with your own before publishing your site — " +
      "have it reviewed by legal counsel to ensure it accurately reflects how your business collects, uses, and protects personal data.</p>",
  },
  {
    slug: "terms-of-service",
    title: "Terms of Service",
    content:
      "<p>This is a placeholder terms of service page. Replace this content with your own before publishing your site — " +
      "have it reviewed by legal counsel to ensure it's appropriate for your business.</p>",
  },
];

export const LANDING_PAGE_ABOUT_SEED = {
  heading: "About Our Company",
  content:
    "<p>We're a team dedicated to delivering great outcomes for our clients, with a straightforward, collaborative approach.</p>" +
    "<ul><li>Proven track record across industries</li><li>Dedicated support at every step</li><li>Transparent, collaborative process</li></ul>",
  metaDescription: "Learn more about our company, what we do, and how we can help your business grow.",
};

export const LANDING_PAGE_BUSINESS_HOURS: BusinessHourEntry[] = [
  { day: "Monday", openTime: "09:00", closeTime: "17:00", isClosed: false },
  { day: "Tuesday", openTime: "09:00", closeTime: "17:00", isClosed: false },
  { day: "Wednesday", openTime: "09:00", closeTime: "17:00", isClosed: false },
  { day: "Thursday", openTime: "09:00", closeTime: "17:00", isClosed: false },
  { day: "Friday", openTime: "09:00", closeTime: "17:00", isClosed: false },
  { day: "Saturday", openTime: "09:00", closeTime: "17:00", isClosed: true },
  { day: "Sunday", openTime: "09:00", closeTime: "17:00", isClosed: true },
];

export const LANDING_PAGE_BLOG_POST_SEED = {
  title: "Welcome to Our New Website",
  excerpt: "We're excited to launch our new website — here's what you can expect.",
  content:
    "<p>We're excited to launch our new website! This is the place to find out more about who we are, what we do, and how we can help.</p>" +
    "<p>Check back here for updates, news, and insights from our team.</p>",
};
