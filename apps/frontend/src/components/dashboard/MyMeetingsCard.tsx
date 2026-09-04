import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import { MeetingListItemDto } from "@hrm-plus/shared";
import { Button, Card, EmptyState, StatusPill } from "@hrm-plus/ui";
import { confirmMeeting, listMyMeetings, respondToMeeting } from "../../api/meetings";
import { apiErrorMessage } from "../../utils/apiError";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function timeRange(startAt: string, endAt: string): string {
  const t = (v: string) =>
    new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${t(startAt)}–${t(endAt)}`;
}

// "Needs my action" — either an RSVP I owe, or a draft I organize that isn't confirmed yet.
function needsMyRsvp(m: MeetingListItemDto): boolean {
  return !m.isOrganizer && m.status !== "Cancelled" && m.myResponseStatus === "Pending";
}
function needsMyConfirm(m: MeetingListItemDto): boolean {
  return m.isOrganizer && m.status === "Draft";
}

export function MyMeetingsCard() {
  const today = todayKey();
  const [meetings, setMeetings] = useState<MeetingListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  function refresh() {
    listMyMeetings({ startDate: today })
      .then((rows) =>
        setMeetings(
          rows
            .filter((m) => m.status !== "Cancelled")
            .sort((a, b) => a.startAt.localeCompare(b.startAt))
        )
      )
      .catch(() => setMeetings([]))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [today]);

  async function rsvp(id: number, response: "Accepted" | "Declined") {
    setBusyId(id);
    setError(null);
    try {
      await respondToMeeting(id, { response });
      refresh();
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to send response"));
    } finally {
      setBusyId(null);
    }
  }

  async function confirm(id: number) {
    setBusyId(id);
    setError(null);
    try {
      await confirmMeeting(id);
      refresh();
    } catch (err) {
      // Blocked or has unacknowledged warnings — send them to the detail page to resolve.
      setError(apiErrorMessage(err, "This meeting needs attention before it can be confirmed"));
    } finally {
      setBusyId(null);
    }
  }

  const todays = meetings.filter((m) => dayKey(m.startAt) === today);
  const upcoming = meetings.filter((m) => dayKey(m.startAt) > today);

  function row(m: MeetingListItemDto) {
    const isToday = dayKey(m.startAt) === today;
    return (
      <div key={m.id} className="flex items-start justify-between gap-3 text-sm">
        <div className="min-w-0">
          <Link to={`/meetings/${m.id}`} className="truncate font-medium text-slate-900 hover:underline">
            {m.title}
          </Link>
          <p className="truncate text-xs text-slate-500">
            {isToday ? "Today" : dayKey(m.startAt)} · {timeRange(m.startAt, m.endAt)}
            {m.locationText ? ` · ${m.locationText}` : ""} · {m.isOrganizer ? "You organize" : `by ${m.organizerName}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {needsMyConfirm(m) && (
            <Button size="sm" onClick={() => confirm(m.id)} isLoading={busyId === m.id}>
              Confirm
            </Button>
          )}
          {needsMyRsvp(m) && (
            <>
              <Button size="sm" variant="secondary" onClick={() => rsvp(m.id, "Accepted")} isLoading={busyId === m.id}>
                Accept
              </Button>
              <Button size="sm" variant="danger" onClick={() => rsvp(m.id, "Declined")} isLoading={busyId === m.id}>
                Decline
              </Button>
            </>
          )}
          {!needsMyConfirm(m) && !needsMyRsvp(m) && (
            <StatusPill status={m.isOrganizer ? m.status : m.myResponseStatus ?? m.status} />
          )}
        </div>
      </div>
    );
  }

  const actionCount = meetings.filter((m) => needsMyRsvp(m) || needsMyConfirm(m)).length;

  return (
    <Card
      title="My Meetings"
      description={
        actionCount > 0
          ? `${actionCount} need${actionCount === 1 ? "s" : ""} your attention`
          : "Today and upcoming"
      }
      actions={
        <Link to="/meetings" className="text-sm text-brand-600 hover:underline">
          View all →
        </Link>
      }
    >
      {error && (
        <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : todays.length === 0 && upcoming.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No meetings scheduled" />
      ) : (
        <div className="space-y-4">
          {todays.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Today</p>
              {todays.map(row)}
            </div>
          )}
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Upcoming</p>
              {upcoming.slice(0, 6).map(row)}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
