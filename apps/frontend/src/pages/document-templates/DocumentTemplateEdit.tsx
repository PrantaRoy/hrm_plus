import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DocumentTemplateDto, RoleDto } from "@hrm-plus/shared";
import { Badge, Button, Card, Checkbox, Field, Input, PageHeader, Select, Spinner, Textarea } from "@hrm-plus/ui";
import { getDocumentTemplate, updateDocumentTemplate } from "../../api/documentTemplates";
import { listRoles } from "../../api/roles";
import { PlaceholderHelp } from "../../components/documents/PlaceholderHelp";
import { ApprovalStepBuilder, StepFormRow, validSteps } from "./ApprovalStepBuilder";

export default function DocumentTemplateEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<DocumentTemplateDto | null>(null);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [name, setName] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [isStaffRequestable, setIsStaffRequestable] = useState(false);
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [approvalSteps, setApprovalSteps] = useState<StepFormRow[]>([]);

  useEffect(() => {
    if (!id) return;
    listRoles().then(setRoles).catch(() => setRoles([]));
    getDocumentTemplate(Number(id))
      .then((t) => {
        setTemplate(t);
        setName(t.name);
        setBodyHtml(t.bodyHtml);
        setIsStaffRequestable(t.isStaffRequestable);
        setStatus(t.status);
        setApprovalSteps(t.approvalSteps.map((s) => ({ approverType: s.approverType, roleId: s.roleId ? String(s.roleId) : "" })));
      })
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load document template"))
      .finally(() => setLoading(false));
  }, [id]);

  function insertPlaceholder(token: string) {
    const textarea = bodyRef.current;
    if (!textarea) {
      setBodyHtml((html) => html + token);
      return;
    }
    const start = textarea.selectionStart ?? bodyHtml.length;
    const end = textarea.selectionEnd ?? bodyHtml.length;
    const next = bodyHtml.slice(0, start) + token + bodyHtml.slice(end);
    setBodyHtml(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    if (!validSteps(approvalSteps)) {
      setError("Every 'Role' step needs a role selected");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const updated = await updateDocumentTemplate(Number(id), {
        name,
        bodyHtml,
        isStaffRequestable,
        status,
        approvalSteps: approvalSteps.map((s) => ({
          approverType: s.approverType,
          roleId: s.approverType === "Role" ? Number(s.roleId) : undefined,
        })),
      });
      setTemplate(updated);
      navigate("/document-templates");
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update document template");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
        {error ?? "Document template not found"}
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader
        title={`Edit Template — ${template.name}`}
        description={
          <span className="flex items-center gap-2">
            <span className="font-mono text-xs">{template.shortCode}</span>
            <Badge color="slate">{template.categoryName}</Badge>
          </span>
        }
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" required>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Select>
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Checkbox checked={isStaffRequestable} onChange={(e) => setIsStaffRequestable(e.target.checked)} />
            Staff can request this document from their dashboard
          </label>

          <ApprovalStepBuilder steps={approvalSteps} roles={roles} onChange={setApprovalSteps} />

          <Field label="Document body (HTML/CSS)" required>
            <Textarea
              ref={bodyRef}
              rows={16}
              required
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              className="font-mono text-xs"
            />
          </Field>

          <PlaceholderHelp onInsert={insertPlaceholder} />

          <Button type="submit" isLoading={submitting}>
            Save Changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
