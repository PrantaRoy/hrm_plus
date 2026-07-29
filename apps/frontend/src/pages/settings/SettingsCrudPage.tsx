import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  Button,
  Checkbox,
  EmptyState,
  Input,
  Select,
  Spinner,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";

export type FieldType = "text" | "number" | "time" | "boolean" | "status";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
}

interface SettingsCrudPageProps<T extends { id: number }> {
  title: string;
  fields: FieldDef[];
  emptyForm: Record<string, unknown>;
  list: () => Promise<T[]>;
  create: (input: Record<string, unknown>) => Promise<T>;
  update: (id: number, input: Record<string, unknown>) => Promise<T>;
  remove: (id: number) => Promise<void>;
  isLocked?: (item: T) => boolean;
}

function renderDisplayValue(field: FieldDef, value: unknown) {
  if (field.type === "boolean") {
    return value ? "Yes" : "No";
  }
  if (field.type === "status") {
    return <StatusPill status={String(value ?? "Active")} />;
  }
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  return String(value);
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (field.type === "boolean") {
    return <Checkbox checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />;
  }
  if (field.type === "status") {
    return (
      <Select value={String(value ?? "Active")} onChange={(e) => onChange(e.target.value)}>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </Select>
    );
  }
  return (
    <Input
      type={field.type === "number" ? "number" : field.type === "time" ? "time" : "text"}
      value={value === null || value === undefined ? "" : String(value)}
      onChange={(e) =>
        onChange(field.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)
      }
    />
  );
}

export default function SettingsCrudPage<T extends { id: number }>({
  title,
  fields,
  emptyForm,
  list,
  create,
  update,
  remove,
  isLocked,
}: SettingsCrudPageProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState<Record<string, unknown>>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Record<string, unknown>>({});

  function refresh() {
    setLoading(true);
    list()
      .then(setItems)
      .catch((err) => setError(err.response?.data?.error?.message ?? `Failed to load ${title.toLowerCase()}`))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleAdd() {
    setSubmitting(true);
    setError(null);
    try {
      await create(newForm);
      setNewForm(emptyForm);
      setAdding(false);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to create record");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(item: T) {
    setEditingId(item.id);
    setEditForm({ ...item });
  }

  async function handleSaveEdit() {
    if (editingId === null) return;
    setSubmitting(true);
    setError(null);
    try {
      await update(editingId, editForm);
      setEditingId(null);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update record");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this record?")) return;
    setError(null);
    try {
      await remove(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to delete record");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add {title.replace(/s$/, "")}
          </Button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}

      <Table>
        <TableHead>
          <tr>
            {fields.map((f) => (
              <TableHeaderCell key={f.key}>{f.label}</TableHeaderCell>
            ))}
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </tr>
        </TableHead>
        <tbody>
          {adding && (
            <TableRow className="bg-slate-50">
              {fields.map((f) => (
                <TableCell key={f.key}>
                  <FieldInput
                    field={f}
                    value={newForm[f.key]}
                    onChange={(v) => setNewForm((form) => ({ ...form, [f.key]: v }))}
                  />
                </TableCell>
              ))}
              <TableCell className="text-right whitespace-nowrap">
                <Button size="sm" onClick={handleAdd} isLoading={submitting} className="mr-2">
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setAdding(false);
                    setNewForm(emptyForm);
                  }}
                >
                  Cancel
                </Button>
              </TableCell>
            </TableRow>
          )}

          {loading && (
            <tr>
              <td colSpan={fields.length + 1} className="py-10">
                <div className="flex justify-center">
                  <Spinner />
                </div>
              </td>
            </tr>
          )}
          {!loading && items.length === 0 && !adding && (
            <tr>
              <td colSpan={fields.length + 1}>
                <EmptyState title="No records yet" description={`Add your first ${title.toLowerCase()} to get started.`} />
              </td>
            </tr>
          )}

          {!loading &&
            items.map((item) => {
              const locked = isLocked?.(item) ?? false;
              const editing = editingId === item.id;
              return (
                <TableRow key={item.id}>
                  {fields.map((f) => (
                    <TableCell key={f.key}>
                      {editing && !(locked && f.key === "name") ? (
                        <FieldInput
                          field={f}
                          value={editForm[f.key]}
                          onChange={(v) => setEditForm((form) => ({ ...form, [f.key]: v }))}
                        />
                      ) : (
                        renderDisplayValue(f, editing ? editForm[f.key] : (item as any)[f.key])
                      )}
                    </TableCell>
                  ))}
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
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => startEdit(item)}
                          className="mr-2"
                          title={locked ? "Built-in name cannot be changed, but other fields can" : undefined}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(item.id)}
                          disabled={locked}
                          title={locked ? "Built-in records cannot be deleted" : undefined}
                        >
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
  );
}
