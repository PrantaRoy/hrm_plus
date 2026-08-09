import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { PublicSiteSettingDto } from "@hrm-plus/shared";
import { submitPublicContactInquiry } from "../../api/publicContactInquiries";

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

  const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <section id="contact" className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
      <h2 className="text-center text-3xl font-bold text-slate-900">Contact Us</h2>

      <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-3 text-sm text-slate-600"
        >
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
        </motion.div>

        <motion.form
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          onSubmit={handleSubmit}
          className="space-y-3"
        >
          <input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          <input
            placeholder="Subject (optional)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={inputClass}
          />
          <textarea
            required
            placeholder="Message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </motion.form>
      </div>
    </section>
  );
}
