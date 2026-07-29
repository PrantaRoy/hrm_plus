import { FormEvent, useEffect, useState } from "react";
import { DOCUMENT_TYPES, DocumentType, EmployeeDocumentDto } from "@hrm-plus/shared";
import {
  Button,
  Card,
  Field,
  Input,
  Select,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import {
  createEmployeeDocument,
  deleteEmployeeDocument,
  listEmployeeDocuments,
  updateEmployeeDocument,
} from "../../api/employeeDocuments";
import { resolveFileUrl } from "../../utils/fileUrl";

const emptyForm = {
  documentName: "",
  type: "Certification" as DocumentType,
  startDate: "",
  expiryDate: "",
  status: "Active" as "Active" | "Inactive",
};

export function EmployeeDocumentsPanel({ employeeId }: { employeeId: number }) {
  const [documents, setDocuments] = useState<EmployeeDocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  function refresh() {
    setLoading(true);
    listEmployeeDocuments(employeeId)
      .then(setDocuments)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load documents"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [employeeId]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("A document file is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createEmployeeDocument(
        employeeId,
        {
          documentName: form.documentName,
          type: form.type,
          startDate: form.startDate || undefined,
          expiryDate: form.expiryDate || undefined,
          status: form.status,
        },
        file
      );
      setForm(emptyForm);
      setFile(null);
      setAdding(false);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to add document");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(doc: EmployeeDocumentDto) {
    setEditingId(doc.id);
    setEditForm({
      documentName: doc.documentName,
      type: doc.type,
      startDate: doc.startDate ? doc.startDate.slice(0, 10) : "",
      expiryDate: doc.expiryDate ? doc.expiryDate.slice(0, 10) : "",
      status: doc.status,
    });
  }

  async function handleSaveEdit() {
    if (editingId === null) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateEmployeeDocument(employeeId, editingId, {
        documentName: editForm.documentName,
        type: editForm.type,
        startDate: editForm.startDate || null,
        expiryDate: editForm.expiryDate || null,
        status: editForm.status,
      });
      setEditingId(null);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update document");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(docId: number) {
    if (!window.confirm("Delete this document?")) return;
    setError(null);
    try {
      await deleteEmployeeDocument(employeeId, docId);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to delete document");
    }
  }

  return (
    <Card
      title="Documents"
      description="Certifications, licenses, work permits, and visas on file."
      actions={
        !adding && (
          <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
            Add Document
          </Button>
        )
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {adding && (
          <form onSubmit={handleAdd} className="space-y-3 border border-slate-200 rounded-md p-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Document name" required>
                <Input
                  required
                  value={form.documentName}
                  onChange={(e) => setForm((f) => ({ ...f, documentName: e.target.value }))}
                />
              </Field>
              <Field label="Type" required>
                <Select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as DocumentType }))}
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start date">
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </Field>
              <Field label="Expiry date">
                <Input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                />
              </Field>
            </div>
            <Field label="File" required helperText="PDF or image, up to 10MB">
              <input
                type="file"
                required
                accept="application/pdf,image/png,image/jpeg,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" size="sm" isLoading={submitting}>
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  setAdding(false);
                  setForm(emptyForm);
                  setFile(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Expiry</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>File</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-6">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading && documents.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-6">
                  No documents on file.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              documents.map((doc) => {
                const editing = editingId === doc.id;
                return (
                  <TableRow key={doc.id}>
                    <TableCell>
                      {editing ? (
                        <Input
                          value={editForm.documentName}
                          onChange={(e) => setEditForm((f) => ({ ...f, documentName: e.target.value }))}
                        />
                      ) : (
                        doc.documentName
                      )}
                    </TableCell>
                    <TableCell>
                      {editing ? (
                        <Select
                          value={editForm.type}
                          onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value as DocumentType }))}
                        >
                          {DOCUMENT_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        doc.type
                      )}
                    </TableCell>
                    <TableCell>
                      {editing ? (
                        <Input
                          type="date"
                          value={editForm.expiryDate}
                          onChange={(e) => setEditForm((f) => ({ ...f, expiryDate: e.target.value }))}
                        />
                      ) : (
                        doc.expiryDate?.slice(0, 10) ?? "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {editing ? (
                        <Select
                          value={editForm.status}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, status: e.target.value as "Active" | "Inactive" }))
                          }
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </Select>
                      ) : (
                        <StatusPill status={doc.status} />
                      )}
                    </TableCell>
                    <TableCell>
                      {doc.documentFileUrl ? (
                        <a
                          href={resolveFileUrl(doc.documentFileUrl) ?? undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-600 hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {editing ? (
                        <>
                          <Button size="sm" onClick={handleSaveEdit} isLoading={submitting} className="mr-2">
                            Save
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => startEdit(doc)} className="mr-2">
                            Edit
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(doc.id)}>
                            Delete
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
          </tbody>
        </Table>
      </div>
    </Card>
  );
}
