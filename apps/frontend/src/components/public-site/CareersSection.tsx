import { motion } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { PublicJobListItemDto } from "@hrm-plus/shared";

export function CareersSection({ data, tenantSlug }: { data: PublicJobListItemDto[]; tenantSlug: string }) {
  if (data.length === 0) return null;

  return (
    <section id="careers" className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
      <h2 className="text-center text-3xl font-bold text-slate-900">Careers</h2>
      <p className="mt-3 text-center text-sm text-slate-500">Open roles on our team</p>

      <div className="mt-10 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {data.map((job, i) => (
          <motion.div
            key={job.slug}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="flex flex-col items-start justify-between gap-3 px-6 py-4 sm:flex-row sm:items-center"
          >
            <div>
              <h3 className="font-medium text-slate-900">{job.title}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>{job.jobType.replace("_", " ")}</span>
                {job.departmentName && <span>{job.departmentName}</span>}
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {job.location}
                  </span>
                )}
              </div>
            </div>
            <Link
              to={`/jobs/${tenantSlug}/${job.slug}/apply`}
              className="flex items-center gap-1 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Apply <ArrowRight size={14} />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
