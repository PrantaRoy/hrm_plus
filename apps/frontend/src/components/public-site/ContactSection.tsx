import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { PublicSiteSettingDto } from "@hrm-plus/shared";
import { submitPublicContactInquiry } from "../../api/publicContactInquiries";
import { BlobShape } from "./decor/BlobShape";
import { EYEBROW_LABEL, PILL_BUTTON_PRIMARY } from "./decor/publicSiteClasses";

export function ContactSection({
  tenantSlug,
  siteSettings,
}: {
  tenantSlug: string;
  siteSettings: PublicSiteSettingDto;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitPublicContactInquiry(tenantSlug, {
        name,
        email,
        phone: phone || undefined,
        subject: subject || undefined,
        message,
      });
      toast.success("Thanks — we'll be in touch soon.");
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Failed to send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--brand-primary)]/20 bg-[var(--brand-primary-tint)] px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]";

  return (
    <section id="contact" className="bg-[var(--brand-primary-tint)] py-20">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-4 sm:px-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <BlobShape tone="secondary" className="pointer-events-none absolute -left-8 top-0 h-32 w-32 opacity-30" />
          <div className="relative">
            <span className={EYEBROW_LABEL}>Contact Us</span>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Let's Collaborate Now!</h2>

            <div className="mt-6 space-y-3 text-sm text-slate-600">
              {siteSettings.contactEmail && <p>Email: {siteSettings.contactEmail}</p>}
              {siteSettings.contactPhone && <p>Phone: {siteSettings.contactPhone}</p>}
              {siteSettings.contactAddress && <p>Address: {siteSettings.contactAddress}</p>}
              {siteSettings.businessHours && siteSettings.businessHours.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Business hours</h3>
                  <ul className="mt-2 space-y-1">
                    {siteSettings.businessHours.map((h) => (
                      <li key={h.day} className="flex justify-between gap-6">
                        <span>{h.day}</span>
                        <span>{h.isClosed ? "Closed" : `${h.openTime} – ${h.closeTime}`}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          onSubmit={handleSubmit}
          className="space-y-3"
        >
          <input required placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            <input
              placeholder="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </div>
          <input
            placeholder="Subject (optional)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={inputClass}
          />
          <textarea
            required
            placeholder="Write Message..."
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={inputClass}
          />
          <button type="submit" disabled={submitting} className={`${PILL_BUTTON_PRIMARY} disabled:opacity-60`}>
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </motion.form>
      </div>
    </section>
  );
}
