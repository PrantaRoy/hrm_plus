import { FormEvent, useEffect, useState } from "react";
import { HolidayDto, HolidayStatus } from "@hrm-plus/shared";
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Select,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import {
  createHoliday,
  deleteHoliday,
  importHolidays,
  listHolidays,
  publishHoliday,
  publishYear,
  unpublishHoliday,
  updateHoliday,
} from "../../api/holidays";

const emptyForm = { name: "", date: "", notes: "" };

const CURRENT_YEAR = new Date().getFullYear();

export default function HolidayList() {
  const [holidays, setHolidays] = useState<HolidayDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [year, setYear] = useState(CURRENT_YEAR);
  const [statusFilter, setStatusFilter] = useState<HolidayStatus | "">("");

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const [importCountry, setImportCountry] = useState<"NZ" | "AU">("NZ");
  const [importYear, setImportYear] = useState(CURRENT_YEAR);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const [publishingYear, setPublishingYear] = useState(false);

  function refresh() {
    setLoading(true);
    listHolidays({ year, status: statusFilter || undefined })
      .then(setHolidays)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load holidays"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [year, statusFilter]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createHoliday({ name: form.name, date: form.date, notes: form.notes || null });
      setForm(emptyForm);
      setAdding(false);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to create holiday");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(holiday: HolidayDto) {
    setEditingId(holiday.id);
    setEditForm({ name: holiday.name, date: holiday.date.slice(0, 10), notes: holiday.notes ?? "" });
  }

  async function handleSaveEdit() {
    if (editingId === null) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateHoliday(editingId, { name: editForm.name, date: editForm.date, notes: editForm.notes || null });
      setEditingId(null);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update holiday");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this holiday?")) return;
    setError(null);
    try {
      await deleteHoliday(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to delete holiday");
    }
  }

  async function handlePublish(id: number) {
    setError(null);
    try {
      await publishHoliday(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to publish holiday");
    }
  }

  async function handleUnpublish(id: number) {
    setError(null);
    try {
      await unpublishHoliday(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to unpublish holiday");
    }
  }

  async function handleImport() {
    setImporting(true);
    setImportMessage(null);
    setError(null);
    try {
      const result = await importHolidays({ country: importCountry, year: importYear });
      setImportMessage(
        `${result.imported} imported, ${result.skipped} skipped (already on file). Review below and publish when ready.`
      );
      if (importYear === year) refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to import holidays");
    } finally {
      setImporting(false);
    }
  }

  async function handlePublishYear() {
    if (!window.confirm(`Publish all draft holidays for ${year}? Staff will see them on their calendars.`)) return;
    setPublishingYear(true);
    setError(null);
    try {
      const result = await publishYear(year);
      window.alert(`Published ${result.published} holiday(s) for ${year}.`);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to publish holidays");
    } finally {
      setPublishingYear(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Public Holidays"
        description="Manage the holiday calendar. Draft holidays are only visible here until published."
        actions={
          !adding && (
            <Button onClick={() => setAdding(true)}>Create Holiday</Button>
          )
        }
      />

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}

      <Card
        title="Import from a public API"
        description="Sourced from nagerholidays.com, a community-maintained aggregator of official government calendars — review before publishing."
      >
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Country">
            <Select value={importCountry} onChange={(e) => setImportCountry(e.target.value as "NZ" | "AU")}>
              <option value="NZ">New Zealand</option>
              <option value="AU">Australia</option>
            </Select>
          </Field>
          <Field label="Year">
            <Input
              type="number"
              value={importYear}
              onChange={(e) => setImportYear(Number(e.target.value))}
              className="w-28"
            />
          </Field>
          <Button variant="secondary" isLoading={importing} onClick={handleImport}>
            Fetch
          </Button>
        </div>
        {importMessage && <p className="mt-3 text-sm text-slate-600">{importMessage}</p>}
      </Card>

      {adding && (
        <Card title="New holiday">
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" required>
                <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </Field>
              <Field label="Date" required>
                <Input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </Field>
            </div>
            <Field label="Notes">
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" isLoading={submitting}>
                Save
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setAdding(false);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Field label="Year">
          <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28" />
        </Field>
        <Field label="Status">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as HolidayStatus | "")}>
            <option value="">All statuses</option>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
          </Select>
        </Field>
        <div className="pt-6">
          <Button variant="secondary" isLoading={publishingYear} onClick={handlePublishYear}>
            Publish All Draft for {year}
          </Button>
        </div>
      </div>

      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell>Source</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </tr>
        </TableHead>
        <tbody>
          {loading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-slate-400 py-6">
                Loading...
              </TableCell>
            </TableRow>
          )}
          {!loading && holidays.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-slate-400 py-6">
                No holidays for {year}.
              </TableCell>
            </TableRow>
          )}
          {!loading &&
            holidays.map((holiday) => {
              const editing = editingId === holiday.id;
              return (
                <TableRow key={holiday.id}>
                  <TableCell>
                    {editing ? (
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    ) : (
                      <div>
                        <div className="font-medium text-slate-900">{holiday.name}</div>
                        {holiday.notes && <div className="text-xs text-slate-400">{holiday.notes}</div>}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editing ? (
                      <Input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                      />
                    ) : (
                      new Date(holiday.date).toLocaleDateString(undefined, { timeZone: "UTC" })
                    )}
                  </TableCell>
                  <TableCell>{holiday.source}</TableCell>
                  <TableCell>
                    <StatusPill status={holiday.status} />
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
                        {holiday.status === "Draft" ? (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => startEdit(holiday)} className="mr-2">
                              Edit
                            </Button>
                            <Button size="sm" onClick={() => handlePublish(holiday.id)} className="mr-2">
                              Publish
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleDelete(holiday.id)}>
                              Delete
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="secondary" onClick={() => handleUnpublish(holiday.id)}>
                            Unpublish
                          </Button>
                        )}
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
