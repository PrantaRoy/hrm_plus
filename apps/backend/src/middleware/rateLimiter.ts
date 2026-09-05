import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// Public contact form: 5 submissions per IP per tenant per hour. Keyed by tenant
// since each tenant's public site is a fully separate audience/database.
// Uses the ipKeyGenerator helper (not raw req.ip) so IPv6 addresses are normalized
// to their subnet — express-rate-limit rejects raw IP string concatenation at
// startup as an IPv6 bypass risk.
export const contactInquiryRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.tenant?.id ?? "unknown"}:${ipKeyGenerator(req.ip ?? "")}`,
  message: {
    error: {
      message: "Too many inquiries submitted. Please try again later.",
      code: "RATE_LIMITED",
    },
  },
});

// SaaS marketing-site contact form: 5 submissions per IP per hour. There is a
// single global control plane here, so the key is IP-only (no tenant scope).
export const saasContactRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ""),
  message: {
    error: {
      message: "Too many messages submitted. Please try again later.",
      code: "RATE_LIMITED",
    },
  },
});
