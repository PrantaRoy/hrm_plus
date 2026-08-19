import { useState } from "react";
import { motion } from "framer-motion";
import { PublicCompanyServiceDto } from "@hrm-plus/shared";
import { Modal } from "@hrm-plus/ui";
import { LucideIcon } from "../../utils/lucideIcon";
import { SquiggleArrow } from "./decor/SquiggleArrow";
import { EYEBROW_LABEL } from "./decor/publicSiteClasses";

export function OverviewSection({ data }: { data: PublicCompanyServiceDto[] }) {
  const [active, setActive] = useState<PublicCompanyServiceDto | null>(null);
  if (data.length === 0) return null;

  return (
    <section id="overview" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <span className={EYEBROW_LABEL}>Services</span>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Our Capabilities</h2>
            <p className="mt-3 text-sm text-slate-500">
              We bring the breadth of our experience and industry knowledge to help you succeed.
            </p>
            <SquiggleArrow className="mt-4 hidden h-12 w-20 text-[var(--brand-primary)] lg:block" />
          </motion.div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {data.map((service, i) => (
              <motion.button
                key={service.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                onClick={() => setActive(service)}
                className="rounded-2xl bg-[var(--brand-primary-tint)] p-6 text-left transition hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                  <LucideIcon name={service.icon} size={22} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{service.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{service.summary}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.title} size="lg">
        {active && <div className="ps-about-content" dangerouslySetInnerHTML={{ __html: active.description }} />}
      </Modal>
    </section>
  );
}
