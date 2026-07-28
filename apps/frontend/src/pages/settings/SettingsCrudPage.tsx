import { useEffect, useState } from "react";

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
    return (
      <span
        className={
          value === "Active"
            ? "text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs"
            : "text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-xs"
        }
      >
        {String(value ?? "Active")}
      </span>
    );
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
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
    );
  }
  if (field.type === "status") {
    return (
      <select
        value={String(value ?? "Active")}
        onChange={(e) => onChange(e.target.value)}
        className="border border-slate-300 rounded px-2 py-1 text-sm w-full"
      >
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
    );
  }
  return (
    <input
      type={field.type === "number" ? "number" : field.type === "time" ? "time" : "text"}
      value={value === null || value === undefined ? "" : String(value)}
      onChange={(e) =>
        onChange(field.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)
      }
      className="border border-slate-300 rounded px-2 py-1 text-sm w-full"
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
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="bg-slate-900 text-white rounded px-4 py-2 text-sm font-medium"
          >
            Add {title.replace(/s$/, "")}
          </button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              {fields.map((f) => (
                <th key={f.key} className="px-4 py-2">
                  {f.label}
                </th>
              ))}
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {adding && (
              <tr className="border-t border-slate-100 bg-slate-50">
                {fields.map((f) => (
                  <td key={f.key} className="px-4 py-2">
                    <FieldInput
                      field={f}
                      value={newForm[f.key]}
                      onChange={(v) => setNewForm((form) => ({ ...form, [f.key]: v }))}
                    />
                  </td>
                ))}
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button
                    onClick={handleAdd}
                    disabled={submitting}
                    className="bg-slate-900 text-white rounded px-3 py-1 text-xs font-medium disabled:opacity-50 mr-2"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setAdding(false);
                      setNewForm(emptyForm);
                    }}
                    className="border border-slate-300 rounded px-3 py-1 text-xs"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td colSpan={fields.length + 1} className="px-4 py-6 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && !adding && (
              <tr>
                <td colSpan={fields.length + 1} className="px-4 py-6 text-center text-slate-400">
                  No records yet.
                </td>
              </tr>
            )}

            {!loading &&
              items.map((item) => {
                const locked = isLocked?.(item) ?? false;
                const editing = editingId === item.id;
                return (
                  <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                    {fields.map((f) => (
                      <td key={f.key} className="px-4 py-2 text-slate-600">
                        {editing && !(locked && f.key === "name") ? (
                          <FieldInput
                            field={f}
                            value={editForm[f.key]}
                            onChange={(v) => setEditForm((form) => ({ ...form, [f.key]: v }))}
                          />
                        ) : (
                          renderDisplayValue(f, editing ? editForm[f.key] : (item as any)[f.key])
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      {editing ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            disabled={submitting}
                            className="bg-slate-900 text-white rounded px-3 py-1 text-xs font-medium disabled:opacity-50 mr-2"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="border border-slate-300 rounded px-3 py-1 text-xs"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(item)}
                            className="border border-slate-300 rounded px-3 py-1 text-xs mr-2"
                            title={locked ? "Built-in name cannot be changed, but other fields can" : undefined}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={locked}
                            className="border border-slate-300 rounded px-3 py-1 text-xs text-red-700 disabled:opacity-40"
                            title={locked ? "Built-in records cannot be deleted" : undefined}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
