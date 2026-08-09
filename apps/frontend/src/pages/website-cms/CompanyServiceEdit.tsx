import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Card, Field, Input, PageHeader, Spinner } from "@hrm-plus/ui";
import { RichTextEditor } from "../../components/RichTextEditor";
import { getCompanyService, updateCompanyService } from "../../api/companyServices";
import { IconNameField } from "./components/IconNameField";

export default function CompanyServiceEdit() {
  const { id } = useParams();
  const serviceId = Number(id);

  const [icon, setIcon] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getCompanyService(serviceId)
      .then((service) => {
        setIcon(service.icon);
        setTitle(service.title);
        setSummary(service.summary);
        setDescription(service.description);
        setIsActive(service.isActive);
      })
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load service"))
      .finally(() => setLoading(false));
  }, [serviceId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await updateCompanyService(serviceId, { icon, title, summary, description, isActive });
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update service");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader
        title={title}
        description={
          <Link to="/website-cms/services" className="text-brand-600 hover:underline">
            Back to services
          </Link>
        }
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

          <Field label="Title" required>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>

          <IconNameField value={icon} onChange={setIcon} />

          <Field label="Short summary" required>
            <Input required value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={300} />
          </Field>

          <Field label="Detailed description" required>
            <RichTextEditor value={description} onChange={setDescription} />
          </Field>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active (visible on the public website)
          </label>

          <Button type="submit" isLoading={submitting}>
            Save Changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
