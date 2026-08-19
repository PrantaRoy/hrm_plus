import { motion } from "framer-motion";
import { PublicSiteSettingDto } from "@hrm-plus/shared";
import { BlobShape } from "./decor/BlobShape";
import { SquiggleArrow } from "./decor/SquiggleArrow";
import { EYEBROW_LABEL, PILL_BUTTON_PRIMARY } from "./decor/publicSiteClasses";

export function AboutSection({ data }: { data: PublicSiteSettingDto }) {
  if (!data.aboutContent) return null;

  return (
    <section id="about" className="px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl rounded-3xl bg-[var(--brand-navy)] px-6 py-16 sm:px-12 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2"
        >
          <div className="relative hidden h-64 lg:block">
            <BlobShape tone="secondary" className="absolute left-6 top-2 h-40 w-40 opacity-70" />
            <BlobShape tone="white" className="absolute bottom-0 right-4 h-32 w-32 opacity-20" />
            <SquiggleArrow className="absolute left-1/2 top-1/2 h-16 w-24 -translate-x-1/2 -translate-y-1/2 text-white/70" />
          </div>

          <div>
            <span className={EYEBROW_LABEL}>Why Choose Us</span>
            {data.aboutHeading && (
              <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">{data.aboutHeading}</h2>
            )}
            <div
              className="ps-about-content mt-6 text-white/85"
              dangerouslySetInnerHTML={{ __html: data.aboutContent }}
            />
            <a href="#contact" className={`mt-8 ${PILL_BUTTON_PRIMARY}`}>
              Get Started
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
