import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Field, Input, PageHeader } from "@hrm-plus/ui";
import { RichTextEditor } from "../../components/RichTextEditor";
import { createCompanyService } from "../../api/companyServices";
import { IconNameField } from "./components/IconNameField";

export default function CompanyServiceCreate() {
  const navigate = useNavigate();
  const [icon, setIcon] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createCompanyService({ icon, title, summary, description });
      navigate("/website-cms/services");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to create service");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader title="New Service" />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

          <Field label="Title" required>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>

          <IconNameField value={icon} onChange={setIcon} />

          <Field label="Short summary" required helperText="Shown on the service card">
            <Input required value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={300} />
          </Field>

          <Field label="Detailed description" required>
            <RichTextEditor value={description} onChange={setDescription} />
          </Field>

          <Button type="submit" isLoading={submitting}>
            Create Service
          </Button>
        </form>
      </Card>
    </div>
  );
}
