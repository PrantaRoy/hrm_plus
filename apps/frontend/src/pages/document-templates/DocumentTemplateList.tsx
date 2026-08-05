import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { DocumentTemplateDto } from "@hrm-plus/shared";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  Spinner,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import { disableDocumentTemplate, listDocumentTemplates } from "../../api/documentTemplates";

export default function DocumentTemplateList() {
  const [templates, setTemplates] = useState<DocumentTemplateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    listDocumentTemplates()
      .then(setTemplates)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load document templates"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleDisable(id: number) {
    if (!window.confirm("Disable this document template? Staff will no longer be able to request it.")) return;
    setError(null);
    try {
      await disableDocumentTemplate(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to disable template");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Document Templates"
        description="Define the document types staff can request, with a short code, body, and approval chain."
        actions={
          <Link
            to="/document-templates/new"
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            New Template
          </Link>
        }
      />

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}

      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Short Code</TableHeaderCell>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Category</TableHeaderCell>
            <TableHeaderCell>Approval Chain</TableHeaderCell>
            <TableHeaderCell>Staff Requestable</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </tr>
        </TableHead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={7} className="py-12">
                <div className="flex justify-center">
                  <Spinner />
                </div>
              </td>
            </tr>
          )}
          {!loading && templates.length === 0 && (
            <tr>
              <td colSpan={7}>
                <EmptyState title="No document templates yet" description="Create one to get started." />
              </td>
            </tr>
          )}
          {!loading &&
            templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-mono text-xs">{template.shortCode}</TableCell>
                <TableCell className="font-medium text-slate-900">{template.name}</TableCell>
                <TableCell>{template.categoryName}</TableCell>
                <TableCell>
                  {template.approvalSteps
                    .map((s) => (s.approverType === "ReportingManager" ? "Reporting Manager" : s.roleName ?? "Role"))
                    .join(" → ")}
                </TableCell>
                <TableCell>
                  <Badge color={template.isStaffRequestable ? "green" : "slate"}>
                    {template.isStaffRequestable ? "Yes" : "Admin/HR only"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <StatusPill status={template.status} />
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Link to={`/document-templates/${template.id}/edit`} className="text-sm text-brand-600 hover:underline mr-3">
                    Edit
                  </Link>
                  {template.status === "Active" && (
                    <Button variant="danger" size="sm" onClick={() => handleDisable(template.id)}>
                      Disable
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
        </tbody>
      </Table>
    </div>
  );
}
