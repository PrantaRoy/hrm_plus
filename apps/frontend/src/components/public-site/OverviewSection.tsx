import { useState } from "react";
import { motion } from "framer-motion";
import { PublicCompanyServiceDto } from "@hrm-plus/shared";
import { Modal } from "@hrm-plus/ui";
import { LucideIcon } from "../../utils/lucideIcon";

export function OverviewSection({ data }: { data: PublicCompanyServiceDto[] }) {
  const [active, setActive] = useState<PublicCompanyServiceDto | null>(null);
  if (data.length === 0) return null;

  return (
    <section id="overview" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-slate-900">Our Services</h2>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((service, i) => (
            <motion.button
              key={service.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              onClick={() => setActive(service)}
              className="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <LucideIcon name={service.icon} size={22} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{service.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{service.summary}</p>
            </motion.button>
          ))}
        </div>
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.title} size="lg">
        {active && (
          <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: active.description }} />
        )}
      </Modal>
    </section>
  );
}
