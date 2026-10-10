// Sample data used when a SaaS admin ticks "Add demo / seed data" while creating a company.
// Generic placeholder content — meant to be edited or deleted by the tenant admin.

export const DEMO_DEPARTMENTS = ["Administration", "Sales", "Support", "HR", "Product", "Inventory"];

export const DEMO_DESIGNATIONS = ["CEO", "COO", "Manager", "Team Lead", "Engineer", "Accountant", "Staff"];

export const DEMO_LEAVE_TYPES: Array<{ name: string; assignedDays: number }> = [
  { name: "Maternity", assignedDays: 90 },
  { name: "Parental", assignedDays: 14 },
  { name: "Sick", assignedDays: 10 },
  { name: "Paid", assignedDays: 20 },
  { name: "Unpaid", assignedDays: 30 },
  { name: "Birthday", assignedDays: 1 },
];

export const DEMO_SHIFTS = [
  { name: "Morning", startTime: "08:00", endTime: "16:00" },
  { name: "Day", startTime: "12:00", endTime: "20:00" },
  { name: "Night", startTime: "16:00", endTime: "23:59" },
];

export const DEMO_HERO_SLIDES = [
  {
    headline: "Grow Your Business With Confidence",
    subHeadline: "Plan, launch and scale with a team that has your back.",
    ctaPrimaryText: "Get Started",
    ctaPrimaryUrl: "#contact",
    ctaSecondaryText: "Our Services",
    ctaSecondaryUrl: "#overview",
    tone: "primary" as const,
  },
  {
    headline: "Technology That Moves You Forward",
    subHeadline: "Modern software and cloud solutions built around your goals.",
    ctaPrimaryText: "Talk To Us",
    ctaPrimaryUrl: "#contact",
    ctaSecondaryText: "Learn More",
    ctaSecondaryUrl: "#about",
    tone: "secondary" as const,
  },
  {
    headline: "Support You Can Rely On",
    subHeadline: "Responsive, friendly help whenever you need it.",
    ctaPrimaryText: "Contact Support",
    ctaPrimaryUrl: "#contact",
    ctaSecondaryText: "Read Our Blog",
    ctaSecondaryUrl: "#blogs",
    tone: "primary" as const,
  },
];

export const DEMO_SERVICES = [
  {
    icon: "TrendingUp",
    title: "Sales",
    summary: "Grow revenue with a clear, repeatable sales approach.",
    description: "<p>We help you find customers, shape offers and close deals with confidence.</p>",
  },
  {
    icon: "Code",
    title: "Development",
    summary: "Custom development tailored to your business needs.",
    description: "<p>From idea to launch, our engineers build reliable, maintainable solutions.</p>",
  },
  {
    icon: "Laptop",
    title: "Software",
    summary: "Software products that streamline how your team works.",
    description: "<p>Business software designed to cut busywork and keep everyone aligned.</p>",
  },
  {
    icon: "Smartphone",
    title: "Application",
    summary: "Web and mobile applications your customers will enjoy.",
    description: "<p>Intuitive, fast applications for web and mobile, built to scale with you.</p>",
  },
  {
    icon: "Cloud",
    title: "Cloud",
    summary: "Secure, scalable cloud infrastructure and migration.",
    description: "<p>We design, migrate and manage cloud environments so you can focus on your business.</p>",
  },
];

export const DEMO_BLOG_POSTS = [
  {
    title: "Welcome to Our New Website",
    excerpt: "We're excited to launch our new website — here's what to expect.",
    content: "<p>This is the place to learn who we are, what we do and how we can help.</p>",
  },
  {
    title: "5 Ways to Streamline Your Daily Operations",
    excerpt: "Small process changes that save your team hours every week.",
    content: "<p>Automate repetitive tasks, document your processes, and review your workflows regularly.</p>",
  },
  {
    title: "Why Cloud Adoption Matters for Growing Teams",
    excerpt: "How moving to the cloud improves flexibility, security and cost.",
    content: "<p>Cloud tools let teams collaborate from anywhere while scaling infrastructure on demand.</p>",
  },
  {
    title: "Building a Great Customer Support Experience",
    excerpt: "Practical tips for responsive, empathetic support.",
    content: "<p>Listen first, respond quickly, and follow up. Great support turns customers into advocates.</p>",
  },
  {
    title: "Our Approach to Building Software That Lasts",
    excerpt: "A look at how our engineers plan, build and maintain products.",
    content: "<p>We favour simple designs, thorough testing and continuous improvement over quick fixes.</p>",
  },
];

export const DEMO_ASSETS: Array<{
  name: string;
  category: "Laptop" | "Mobile" | "VehicleCar" | "VehicleVan" | "EmployerHousing" | "OfficeEquipment";
  serialNumber?: string;
  purchaseCost?: number;
  supplier?: string;
  notes?: string;
  make?: string;
  model?: string;
}> = [
  { name: "MacBook Pro 14\"", category: "Laptop", serialNumber: "DEMO-LAP-001", purchaseCost: 2400, supplier: "Apple" },
  { name: "Dell Latitude 5440", category: "Laptop", serialNumber: "DEMO-LAP-002", purchaseCost: 1500, supplier: "Dell" },
  { name: "iPhone 15", category: "Mobile", serialNumber: "DEMO-MOB-001", purchaseCost: 1300, supplier: "Apple" },
  { name: "Samsung Galaxy S24", category: "Mobile", serialNumber: "DEMO-MOB-002", purchaseCost: 1200, supplier: "Samsung" },
  { name: "Company Car", category: "VehicleCar", make: "Toyota", model: "Corolla", purchaseCost: 32000 },
  { name: "Delivery Van", category: "VehicleVan", make: "Ford", model: "Transit", purchaseCost: 45000 },
  { name: "Staff Housing - Unit 1", category: "EmployerHousing", notes: "Two-bedroom apartment for relocating staff." },
  { name: "Office Printer", category: "OfficeEquipment", serialNumber: "DEMO-OFF-001", purchaseCost: 600, supplier: "HP" },
];
