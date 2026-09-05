import { FormEvent, useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { PublicSaasSiteSettingsDto, SaasLandingSectionConfig } from "@hrm-plus/shared";
import { Button, Field, Input, Textarea } from "@hrm-plus/ui";
import { submitContact } from "../../api/contact";
import { LandingSection } from "../LandingSection";

export function ContactSection({
  section,
  settings,
}: {
  section: SaasLandingSectionConfig;
  settings: PublicSaasSiteSettingsDto;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (website) return; // bot
    setStatus("submitting");
    setError(null);
    try {
      await submitContact({
        name: form.name,
        email: form.email,
        company: form.company || undefined,
        subject: form.subject || undefined,
        message: form.message,
      });
      setStatus("done");
      setForm({ name: "", email: "", company: "", subject: "", message: "" });
    } catch (err) {
      setStatus("error");
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
          ?.message ?? "Something went wrong. Please try again.";
      setError(message);
    }
  }

  return (
    <LandingSection
      id="contact"
      heading={section.heading}
      subheading={section.subheading}
      className="bg-slate-50"
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4 text-sm text-slate-600">
          {settings.contactEmail && (
            <a
              href={`mailto:${settings.contactEmail}`}
              className="flex items-center gap-3 hover:text-slate-900"
            >
              <Mail className="h-5 w-5 text-brand-600" />
              {settings.contactEmail}
            </a>
          )}
          {settings.contactPhone && (
            <a href={`tel:${settings.contactPhone}`} className="flex items-center gap-3 hover:text-slate-900">
              <Phone className="h-5 w-5 text-brand-600" />
              {settings.contactPhone}
            </a>
          )}
          {settings.contactAddress && (
            <p className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <span className="whitespace-pre-line">{settings.contactAddress}</span>
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8">
          {status === "done" ? (
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Thanks — your message has been sent. We'll be in touch soon.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="hidden"
                aria-hidden
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" required>
                  <Input required value={form.name} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label="Work email" required>
                  <Input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company">
                  <Input value={form.company} onChange={(e) => set("company", e.target.value)} />
                </Field>
                <Field label="Subject">
                  <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} />
                </Field>
              </div>
              <Field label="Message" required>
                <Textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                />
              </Field>
              <Button type="submit" isLoading={status === "submitting"}>
                Send message
              </Button>
            </form>
          )}
        </div>
      </div>
    </LandingSection>
  );
}
