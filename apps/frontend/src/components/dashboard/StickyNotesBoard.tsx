import { FormEvent, useEffect, useState } from "react";
import { Check, NotebookPen, X } from "lucide-react";
import { StickyNoteDto, StickyNotePriority } from "@hrm-plus/shared";
import { Card, EmptyState, Input } from "@hrm-plus/ui";
import { createStickyNote, listStickyNotes, updateStickyNoteStatus } from "../../api/stickyNotes";

const PRIORITY_OPTIONS: { value: StickyNotePriority; label: string; swatch: string }[] = [
  { value: "HIGH", label: "High", swatch: "bg-rose-500" },
  { value: "MEDIUM", label: "Medium", swatch: "bg-amber-400" },
  { value: "REGULAR", label: "Regular", swatch: "bg-slate-800" },
];

const CARD_CLASSES: Record<StickyNotePriority, string> = {
  HIGH: "bg-rose-100 border-rose-300 text-rose-900",
  MEDIUM: "bg-amber-100 border-amber-300 text-amber-900",
  REGULAR: "bg-slate-800 border-slate-900 text-white",
};

export function StickyNotesBoard() {
  const [notes, setNotes] = useState<StickyNoteDto[]>([]);
  const [content, setContent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<StickyNotePriority>("REGULAR");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listStickyNotes()
      .then(setNotes)
      .catch(() => setNotes([]));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim() || saving) return;
    setSaving(true);
    try {
      const note = await createStickyNote({
        content: content.trim(),
        priority,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      });
      setNotes((prev) => [note, ...prev]);
      setContent("");
      setDeadline("");
      setPriority("REGULAR");
    } finally {
      setSaving(false);
    }
  }

  async function handleHide(id: number, status: "DONE" | "DISMISSED") {
    await updateStickyNoteStatus(id, status);
    setNotes((prev) => prev.filter((note) => note.id !== id));
  }

  return (
    <Card title="Sticky Notes" description="Quick personal reminders — only you can see these.">
      <form onSubmit={handleSubmit} className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a quick note…"
          maxLength={2000}
          className="sm:flex-1"
        />
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 sm:w-auto"
        />
        <div className="flex items-center gap-1.5">
          {PRIORITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={priority === option.value}
              title={option.label}
              onClick={() => setPriority(option.value)}
              className={`h-6 w-6 rounded-full ${option.swatch} transition-transform ${
                priority === option.value ? "scale-110 ring-2 ring-offset-2 ring-brand-500" : "opacity-60 hover:opacity-100"
              }`}
            />
          ))}
        </div>
        <button
          type="submit"
          disabled={saving || !content.trim()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {notes.length === 0 ? (
        <EmptyState icon={NotebookPen} title="No sticky notes yet" description="Add a quick note above to see it here." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => {
            const overdue = note.deadline && note.status === "ACTIVE" && new Date(note.deadline) < new Date();
            return (
              <div
                key={note.id}
                className={`relative rounded-card border p-4 pr-16 shadow-card ${CARD_CLASSES[note.priority]}`}
              >
                <p className="whitespace-pre-wrap break-words text-sm">{note.content}</p>
                {note.deadline && (
                  <p className={`mt-2 text-xs ${overdue ? "font-semibold" : "opacity-75"}`}>
                    {overdue ? "Overdue · " : "Due "}
                    {new Date(note.deadline).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                )}
                <div className="absolute right-3 top-3 flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleHide(note.id, "DONE")}
                    aria-label="Mark done"
                    title="Mark done"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-emerald-600 shadow-sm hover:bg-white"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHide(note.id, "DISMISSED")}
                    aria-label="Dismiss"
                    title="Dismiss"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm hover:bg-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
