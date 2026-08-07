import { FormEvent, useEffect, useState } from "react";
import { SCREENING_QUESTION_TYPES, ScreeningQuestionDto } from "@hrm-plus/shared";
import { Badge, Button, Card, Field, Input, PageHeader, Select, Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@hrm-plus/ui";
import {
  createScreeningQuestion,
  deleteScreeningQuestion,
  listScreeningQuestions,
  seedLegalComplianceQuestions,
  updateScreeningQuestion,
} from "../../api/screeningQuestions";

const emptyForm = { text: "", type: "SHORT_TEXT" as (typeof SCREENING_QUESTION_TYPES)[number], options: "" };

export default function ScreeningQuestionList() {
  const [questions, setQuestions] = useState<ScreeningQuestionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    listScreeningQuestions()
      .then(setQuestions)
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load questions"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const needsOptions = form.type === "SINGLE_CHOICE" || form.type === "MULTIPLE_CHOICE";
      await createScreeningQuestion({
        text: form.text,
        type: form.type,
        options: needsOptions
          ? form.options
              .split(",")
              .map((o) => o.trim())
              .filter(Boolean)
          : undefined,
      });
      setForm(emptyForm);
      setAdding(false);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to create question");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(question: ScreeningQuestionDto) {
    setError(null);
    try {
      await updateScreeningQuestion(question.id, { status: question.status === "Active" ? "Inactive" : "Active" });
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to update question");
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this screening question?")) return;
    setError(null);
    try {
      await deleteScreeningQuestion(id);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to delete question");
    }
  }

  async function handleSeed() {
    setSeeding(true);
    setSeedMessage(null);
    setError(null);
    try {
      const result = await seedLegalComplianceQuestions();
      setSeedMessage(`${result.created} added, ${result.skipped} already present.`);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to seed compliance questions");
    } finally {
      setSeeding(false);
    }
  }

  const needsOptions = form.type === "SINGLE_CHOICE" || form.type === "MULTIPLE_CHOICE";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Screening Questions"
        description="A reusable question bank to attach to job circulars."
        actions={!adding && <Button onClick={() => setAdding(true)}>Add Question</Button>}
      />

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      <Card
        title="NZ / AU legal compliance questions"
        description="Seed pre-built, legally-compliant questions (Criminal Records Clean Slate Act 2004, right to work / visa status)."
      >
        <Button variant="secondary" isLoading={seeding} onClick={handleSeed}>
          Seed Compliance Questions
        </Button>
        {seedMessage && <p className="mt-3 text-sm text-slate-600">{seedMessage}</p>}
      </Card>

      {adding && (
        <Card title="New question">
          <form onSubmit={handleAdd} className="space-y-3">
            <Field label="Question text" required>
              <Input required value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} />
            </Field>
            <Field label="Type" required>
              <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as typeof form.type }))}>
                {SCREENING_QUESTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace("_", " ")}
                  </option>
                ))}
              </Select>
            </Field>
            {needsOptions && (
              <Field label="Options" required helperText="Comma-separated">
                <Input required value={form.options} onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))} />
              </Field>
            )}
            <div className="flex gap-2">
              <Button type="submit" isLoading={submitting}>
                Save
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setAdding(false); setForm(emptyForm); }}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Question</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Category</TableHeaderCell>
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
          {!loading && questions.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-slate-400 py-6">
                No screening questions yet.
              </TableCell>
            </TableRow>
          )}
          {!loading &&
            questions.map((q) => (
              <TableRow key={q.id}>
                <TableCell>{q.text}</TableCell>
                <TableCell>{q.type.replace("_", " ")}</TableCell>
                <TableCell>
                  {q.category === "LegalCompliance" ? <Badge color="brand">Legal/Compliance</Badge> : "Custom"}
                </TableCell>
                <TableCell>
                  <Badge color={q.status === "Active" ? "green" : "slate"}>{q.status}</Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button size="sm" variant="secondary" onClick={() => handleToggleStatus(q)} className="mr-2">
                    {q.status === "Active" ? "Deactivate" : "Activate"}
                  </Button>
                  {!q.isSystem && (
                    <Button size="sm" variant="danger" onClick={() => handleDelete(q.id)}>
                      Delete
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
