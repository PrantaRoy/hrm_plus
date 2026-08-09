import { motion } from "framer-motion";
import { PublicSiteSettingDto } from "@hrm-plus/shared";

export function AboutSection({ data }: { data: PublicSiteSettingDto }) {
  if (!data.aboutContent) return null;

  return (
    <section id="about" className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        {data.aboutHeading && <h2 className="text-3xl font-bold text-slate-900">{data.aboutHeading}</h2>}
        <div className="prose prose-slate mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: data.aboutContent }} />
      </motion.div>
    </section>
  );
}
