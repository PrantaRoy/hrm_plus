import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DocumentCategoryDto, RoleDto } from "@hrm-plus/shared";
import { Button, Card, Checkbox, Field, Input, PageHeader, Select, Textarea } from "@hrm-plus/ui";
import { createDocumentTemplate } from "../../api/documentTemplates";
import { listDocumentCategories } from "../../api/documentCategories";
import { listRoles } from "../../api/roles";
import { PlaceholderHelp } from "../../components/documents/PlaceholderHelp";
import { ApprovalStepBuilder, StepFormRow, validSteps } from "./ApprovalStepBuilder";

export default function DocumentTemplateCreate() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<DocumentCategoryDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [shortCode, setShortCode] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [isStaffRequestable, setIsStaffRequestable] = useState(false);
  const [approvalSteps, setApprovalSteps] = useState<StepFormRow[]>([{ approverType: "ReportingManager", roleId: "" }]);

  useEffect(() => {
    listDocumentCategories().then(setCategories).catch(() => setCategories([]));
    listRoles().then(setRoles).catch(() => setRoles([]));
  }, []);

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
    if (!categoryId) {
      setError("Select a category");
      return;
    }
    if (!validSteps(approvalSteps)) {
      setError("Every 'Role' step needs a role selected");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await createDocumentTemplate({
        shortCode: shortCode.trim().toUpperCase(),
        name,
        categoryId: Number(categoryId),
        bodyHtml,
        isStaffRequestable,
        approvalSteps: approvalSteps.map((s) => ({
          approverType: s.approverType,
          roleId: s.approverType === "Role" ? Number(s.roleId) : undefined,
        })),
      });
      navigate(`/document-templates/${created.id}/edit`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to create document template");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader title="New Document Template" description="Define a document type staff can request." />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Short code" required helperText="UPPER_SNAKE_CASE, unique — e.g. APPOINT_LETTER_SALES">
              <Input
                required
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value.toUpperCase())}
                placeholder="SALARY_CERT"
              />
            </Field>
            <Field label="Name" required>
              <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Salary Certificate" />
            </Field>
          </div>

          <Field label="Category" required>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Checkbox checked={isStaffRequestable} onChange={(e) => setIsStaffRequestable(e.target.checked)} />
            Staff can request this document from their dashboard
          </label>

          <ApprovalStepBuilder steps={approvalSteps} roles={roles} onChange={setApprovalSteps} />

          <Field label="Document body (HTML/CSS)" required helperText="Rendered to PDF; use placeholders below.">
            <Textarea
              ref={bodyRef}
              rows={14}
              required
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              className="font-mono text-xs"
              placeholder="<html>&#10;  <body>&#10;    <h1>Salary Certificate</h1>&#10;    <p>This certifies {{employee.fullName}}...</p>&#10;  </body>&#10;</html>"
            />
          </Field>

          <PlaceholderHelp onInsert={insertPlaceholder} />

          <Button type="submit" isLoading={submitting}>
            Create Template
          </Button>
        </form>
      </Card>
    </div>
  );
}
