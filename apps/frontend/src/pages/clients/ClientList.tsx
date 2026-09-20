import { FormEvent, useCallback, useEffect, useState } from "react";
import { CLIENT_PRIORITIES, ClientDto, ClientPriority } from "@hrm-plus/shared";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Textarea,
} from "@hrm-plus/ui";
import { createClient, deleteClient, listClients, updateClient } from "../../api/clients";
import { apiErrorMessage } from "../../utils/apiError";
import { humanize } from "../../components/projects/format";

interface FormState {
  name: string;
  email: string;
  companyName: string;
  phoneNumber: string;
  address: string;
  tag: string;
  priority: ClientPriority;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  companyName: "",
  phoneNumber: "",
  address: "",
  tag: "",
  priority: "medium",
  isActive: true,
};

function toForm(client: ClientDto): FormState {
  return {
    name: client.name,
    email: client.email,
    companyName: client.companyName ?? "",
    phoneNumber: client.phoneNumber ?? "",
    address: client.address,
    tag: client.tag,
    priority: client.priority,
    isActive: client.isActive,
  };
}

export default function ClientList() {
  const [items, setItems] = useState<ClientDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClientDto | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const pageSize = 20;

  const load = useCallback(() => {
    setLoading(true);
    listClients({
      page,
      pageSize,
      search: search.trim() || undefined,
      isActive: active === "" ? undefined : active === "true",
    })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        setError(null);
      })
      .catch((err) => setError(apiErrorMessage(err, "Failed to load clients")))
      .finally(() => setLoading(false));
  }, [page, search, active]);

  useEffect(load, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(client: ClientDto) {
    setEditing(client);
    setForm(toForm(client));
    setFormError(null);
    setModalOpen(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      companyName: form.companyName.trim() || null,
      phoneNumber: form.phoneNumber.trim() || null,
      address: form.address.trim(),
      tag: form.tag.trim(),
      priority: form.priority,
      isActive: form.isActive,
    };
    try {
      if (editing) await updateClient(editing.id, payload);
      else await createClient(payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, "Failed to save client"));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(client: ClientDto) {
    try {
      await updateClient(client.id, { isActive: !client.isActive });
      load();
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to update client"));
    }
  }

  async function remove(client: ClientDto) {
    if (!window.confirm(`Delete client "${client.name}"?`)) return;
    try {
      await deleteClient(client.id);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to delete client"));
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clients"
        description="Companies and people you run projects for."
        actions={<Button onClick={openCreate}>New client</Button>}
      />

      <Card>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Field label="Search">
            <Input
              value={search}
              placeholder="Name, email, company or tag"
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </Field>
          <Field label="Status">
            <Select
              value={active}
              onChange={(e) => {
                setPage(1);
                setActive(e.target.value);
              }}
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </Field>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}

        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Company</TableHeaderCell>
              <TableHeaderCell>Contact</TableHeaderCell>
              <TableHeaderCell>Tag</TableHeaderCell>
              <TableHeaderCell>Priority</TableHeaderCell>
              <TableHeaderCell>Projects</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {loading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-400 py-6">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-400 py-6">
                  No clients found.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.companyName ?? "—"}</TableCell>
                  <TableCell>
                    <div>{c.email}</div>
                    {c.phoneNumber && <div className="text-xs text-slate-400">{c.phoneNumber}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge>{c.tag}</Badge>
                  </TableCell>
                  <TableCell>{humanize(c.priority)}</TableCell>
                  <TableCell>{c.projectCount}</TableCell>
                  <TableCell>
                    <StatusPill status={c.isActive ? "Active" : "Inactive"} />
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap space-x-3">
                    <button onClick={() => openEdit(c)} className="text-sm text-brand-700 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => toggleActive(c)} className="text-sm text-slate-600 hover:underline">
                      {c.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => remove(c)} className="text-sm text-red-600 hover:underline">
                      Delete
                    </button>
                  </TableCell>
                </TableRow>
              ))}
          </tbody>
        </Table>

        <div className="flex items-center justify-between pt-3 text-sm text-slate-500">
          <span>{total} client(s)</span>
          <span className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">
              Prev
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-40">
              Next
            </button>
          </span>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit client" : "New client"}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="client-form" isLoading={saving}>
              {editing ? "Save changes" : "Create client"}
            </Button>
          </>
        }
      >
        <form id="client-form" onSubmit={submit} className="space-y-4">
          {formError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{formError}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={191} />
            </Field>
            <Field label="Email" required>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </Field>
            <Field label="Company">
              <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
            </Field>
            <Field label="Tag" required>
              <Input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} required maxLength={100} />
            </Field>
            <Field label="Priority" required>
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as ClientPriority })}>
                {CLIENT_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {humanize(p)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Address" required>
            <Textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            Active
          </label>
        </form>
      </Modal>
    </div>
  );
}
