import "dotenv/config";
import { controlClient } from "../src/db/controlClient";
import { seedDefaultSaasLandingContent } from "../src/modules/saas/landing/landingContent.seed";

/**
 * Seeds default content for the SaaS marketing landing page (apps/saas-frontend "/")
 * into the control plane: site settings, hero, feature highlights, feature grid,
 * process steps, stat band, placeholder testimonials, and one welcome blog post.
 * Idempotent — safe to run more than once; it never overwrites edited content.
 */
async function main() {
  const result = await seedDefaultSaasLandingContent();
  console.log("SaaS landing content seeded:", result);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => controlClient.$disconnect());
