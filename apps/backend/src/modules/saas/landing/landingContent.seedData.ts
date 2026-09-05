import {
  CreateSaasLandingBlockInput,
  SaasLandingSectionConfig,
  UpdateSaasSiteSettingsInput,
} from "@hrm-plus/shared";

// Default marketing copy for the HRM PLUS product landing page. The super-admin
// is expected to tailor this in the dashboard. Testimonials below are clearly
// templated placeholders — replace them with real quotes before launch.

export const SAAS_LANDING_SECTIONS_SEED: SaasLandingSectionConfig[] = [
  {
    key: "feature-highlights",
    label: "Feature highlights",
    heading: "Built for the hard parts of HR",
    subheading: "Three capabilities most HR tools make you bolt on later.",
    enabled: true,
    order: 0,
  },
  {
    key: "features",
    label: "Feature grid",
    heading: "Everything else you'd expect",
    subheading: "A complete HR system underneath the headline features.",
    enabled: true,
    order: 1,
  },
  {
    key: "process",
    label: "How it works",
    heading: "Live in a day, not a quarter",
    subheading: "Four steps from sign-up to a team that runs itself.",
    enabled: true,
    order: 2,
  },
  {
    key: "stats",
    label: "Stats band",
    heading: null,
    subheading: null,
    enabled: true,
    order: 3,
  },
  {
    key: "testimonials",
    label: "Testimonials",
    heading: "Teams that switched aren't going back",
    subheading: null,
    enabled: true,
    order: 4,
  },
  {
    key: "pricing",
    label: "Pricing",
    heading: "Simple pricing that scales with your team",
    subheading: "Pick a plan and register your company in minutes.",
    enabled: true,
    order: 5,
  },
  {
    key: "blog",
    label: "Blog",
    heading: "From the blog",
    subheading: "Product updates and notes on running better HR.",
    enabled: true,
    order: 6,
  },
  {
    key: "contact",
    label: "Contact",
    heading: "Talk to us",
    subheading: "Questions about a plan, a migration, or a custom need? Send a note.",
    enabled: true,
    order: 7,
  },
];

export const SAAS_SITE_SETTINGS_SEED: UpdateSaasSiteSettingsInput = {
  siteName: "HRM PLUS",
  navLinks: [
    { label: "Features", href: "#feature-highlights" },
    { label: "How it works", href: "#process" },
    { label: "Pricing", href: "#pricing" },
    { label: "Blog", href: "/blog" },
  ],
  headerCtaLabel: "Get started",
  headerCtaHref: "#pricing",
  loginUrl: "/admin/login",
  heroEyebrow: "HR, hiring & payroll in one place",
  heroHeadline: "Run your whole workforce from one clean dashboard.",
  heroSubheadline:
    "HRM PLUS brings hiring, attendance, documents, leave and payroll together — so your team spends less time on admin and more time on people.",
  heroPrimaryCtaLabel: "Get started",
  heroPrimaryCtaHref: "#pricing",
  heroSecondaryCtaLabel: "See how it works",
  heroSecondaryCtaHref: "#process",
  sections: SAAS_LANDING_SECTIONS_SEED,
  ctaHeading: "Ready to give HR its time back?",
  ctaSubheading:
    "Set up your workspace, invite your team, and let the routine work run itself.",
  ctaButtonLabel: "Get started",
  ctaButtonHref: "#pricing",
  contactHeading: "Talk to us",
  contactSubheading: "Questions about a plan, a migration, or a custom need? Send a note.",
  contactEmail: "hello@hrmplus.example",
  contactPhone: null,
  contactAddress: null,
  footerTagline: "The modern HR platform for growing teams.",
  footerColumns: [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#feature-highlights" },
        { label: "Pricing", href: "#pricing" },
        { label: "Blog", href: "/blog" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Contact", href: "#contact" },
        { label: "Super-admin login", href: "/admin/login" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
      ],
    },
  ],
  socialLinks: [
    { platform: "LinkedIn", icon: "Linkedin", url: "https://www.linkedin.com" },
    { platform: "X", icon: "Twitter", url: "https://x.com" },
  ],
  footerLegalText: "© 2026 HRM PLUS. All rights reserved.",
  metaTitle: "HRM PLUS — Run your whole workforce from one dashboard",
  metaDescription:
    "HRM PLUS brings hiring, attendance, documents, leave and payroll together in one modern HR platform for growing teams.",
};

export const SAAS_FEATURE_HIGHLIGHT_SEEDS: CreateSaasLandingBlockInput[] = [
  {
    blockType: "FEATURE_HIGHLIGHT",
    icon: "Sparkles",
    title: "AI-assisted candidate screening",
    subtitle: "Screen every applicant in minutes.",
    body: "Auto-generated quizzes and Q&A from the job description let candidates answer online, then AI scores and summarizes each submission — so your shortlist is ready before you open the inbox.",
    bullets: [
      "Job-specific question sets",
      "Automated scoring & ranking",
      "Bias-aware, reviewable results",
    ],
    ctaLabel: "See pricing",
    ctaHref: "#pricing",
  },
  {
    blockType: "FEATURE_HIGHLIGHT",
    icon: "FileCheck2",
    title: "Role-templated official documents",
    subtitle: "Salary certificates and letters, signed and verifiable.",
    body: "Generate salary certificates, employment-verification and offer letters from live employee data, route them through a configurable approval chain, and issue digitally-signed PDFs anyone can verify by link or QR code.",
    bullets: [
      "Templates fill from employee records",
      "Multi-step approval workflow",
      "Digitally signed, QR-verifiable PDFs",
    ],
    ctaLabel: "See pricing",
    ctaHref: "#pricing",
  },
  {
    blockType: "FEATURE_HIGHLIGHT",
    icon: "MapPinned",
    title: "Attendance, captured any way your team works",
    subtitle: "Online, QR, or fully offline.",
    body: "Check in from the web, scan a workplace QR code, or capture attendance offline in the field with automatic background sync — every punch bound to the location and IP rules you define.",
    bullets: [
      "Online & QR-code check-in",
      "Offline capture with background sync",
      "Location & IP binding",
    ],
    ctaLabel: "See pricing",
    ctaHref: "#pricing",
  },
];

export const SAAS_FEATURE_SEEDS: CreateSaasLandingBlockInput[] = [
  {
    blockType: "FEATURE",
    icon: "Users",
    title: "Employee records & org chart",
    subtitle: "One source of truth for people, departments and designations.",
  },
  {
    blockType: "FEATURE",
    icon: "CalendarCheck",
    title: "Leave management & approvals",
    subtitle: "Configurable leave types, balances and multi-step approvals.",
  },
  {
    blockType: "FEATURE",
    icon: "CalendarClock",
    title: "Shift scheduling & rosters",
    subtitle: "Build rosters, assign shifts and track duty schedules.",
  },
  {
    blockType: "FEATURE",
    icon: "Wallet",
    title: "Payroll runs & payslips",
    subtitle: "Run payroll with separation of duties and generate payslips.",
  },
  {
    blockType: "FEATURE",
    icon: "Boxes",
    title: "Assets & onboarding",
    subtitle: "Assign assets and track onboarding from day one.",
  },
  {
    blockType: "FEATURE",
    icon: "CalendarDays",
    title: "Meetings & scheduling",
    subtitle: "Schedule meetings with availability checks and conflict detection.",
  },
];

export const SAAS_PROCESS_STEP_SEEDS: CreateSaasLandingBlockInput[] = [
  {
    blockType: "PROCESS_STEP",
    stepNumber: 1,
    title: "Create your workspace",
    subtitle: "Pick a plan and register your company — no card required to apply.",
  },
  {
    blockType: "PROCESS_STEP",
    stepNumber: 2,
    title: "Add your team",
    subtitle: "Import employees and set roles, departments and shifts.",
  },
  {
    blockType: "PROCESS_STEP",
    stepNumber: 3,
    title: "Turn on what you need",
    subtitle: "Enable attendance methods, document templates and payroll.",
  },
  {
    blockType: "PROCESS_STEP",
    stepNumber: 4,
    title: "Go",
    subtitle: "Your team logs in and HR runs itself.",
  },
];

export const SAAS_STAT_SEEDS: CreateSaasLandingBlockInput[] = [
  { blockType: "STAT", title: "Minutes to set up a workspace", value: "10", suffix: "+" },
  { blockType: "STAT", title: "Attendance capture methods", value: "3", suffix: "" },
  { blockType: "STAT", title: "Approval steps you can configure", value: "Unlimited", suffix: "" },
  { blockType: "STAT", title: "Document types out of the box", value: "3", suffix: "" },
];

export const SAAS_TESTIMONIAL_SEEDS: CreateSaasLandingBlockInput[] = [
  {
    blockType: "TESTIMONIAL",
    title: "Placeholder testimonial — replace before launch",
    subtitle:
      "Onboarding took an afternoon and we retired two spreadsheets and a shared inbox in the first week.",
    authorName: "A. Placeholder",
    authorTitle: "Head of People",
    company: "Sample Company",
    rating: 5,
  },
  {
    blockType: "TESTIMONIAL",
    title: "Placeholder testimonial — replace before launch",
    subtitle:
      "The verifiable salary certificates alone paid for the switch — no more back-and-forth with banks.",
    authorName: "B. Placeholder",
    authorTitle: "HR Manager",
    company: "Example Ltd",
    rating: 5,
  },
];

export const SAAS_BLOG_POST_SEED = {
  title: "Welcome to the HRM PLUS blog",
  excerpt: "What to expect here: product updates, and practical notes on running better HR.",
  authorName: "The HRM PLUS Team",
  metaDescription:
    "Product updates and practical notes on running better HR, from the team building HRM PLUS.",
  contentMarkdown: `This is where we'll share product updates and practical notes on running HR for a growing team.

## What we're building

HRM PLUS brings the whole employee lifecycle into one place:

- **AI-assisted candidate screening** — quizzes and Q&A that score themselves
- **Role-templated documents** — salary certificates and letters with an approval workflow and signed, verifiable PDFs
- **Flexible attendance** — online, QR-code, and offline capture with location and IP binding

More soon. In the meantime, [take a look at the plans](/#pricing).
`,
};
