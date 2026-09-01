import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MeetingListItemDto } from "@hrm-plus/shared";
import {
  Button,
  Card,
  PageHeader,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import { listMyMeetings, respondToMeeting } from "../../api/meetings";
import { apiErrorMessage } from "../../utils/apiError";

function formatRange(startAt: string, endAt: string): string {
  const s = new Date(startAt);
  const e = new Date(endAt);
  const day = s.toLocaleDateString();
  const t = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${day} · ${t(s)}–${t(e)}`;
}

export default function MyMeetings() {
  const [meetings, setMeetings] = useState<MeetingListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    listMyMeetings()
      .then(setMeetings)
      .catch((err) => setError(apiErrorMessage(err, "Failed to load meetings")))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function respond(id: number, response: "Accepted" | "Declined") {
    setError(null);
    try {
      await respondToMeeting(id, { response });
      refresh();
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to send response"));
    }
  }

  const organized = meetings.filter((m) => m.isOrganizer);
  const invited = meetings.filter((m) => !m.isOrganizer);

  function renderTable(rows: MeetingListItemDto[], showRsvp: boolean) {
    return (
      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Title</TableHeaderCell>
            <TableHeaderCell>When</TableHeaderCell>
            <TableHeaderCell>Organizer</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            {showRsvp && <TableHeaderCell>My response</TableHeaderCell>}
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </tr>
        </TableHead>
        <tbody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={showRsvp ? 6 : 5} className="text-center text-slate-400 py-6">
                Nothing here yet.
              </TableCell>
            </TableRow>
          )}
          {rows.map((m) => (
            <TableRow key={m.id}>
              <TableCell>{m.title}</TableCell>
              <TableCell className="whitespace-nowrap">{formatRange(m.startAt, m.endAt)}</TableCell>
              <TableCell>{m.organizerName}</TableCell>
              <TableCell>
                <StatusPill status={m.status} />
              </TableCell>
              {showRsvp && (
                <TableCell>{m.myResponseStatus && <StatusPill status={m.myResponseStatus} />}</TableCell>
              )}
              <TableCell className="text-right whitespace-nowrap">
                {showRsvp && m.status !== "Cancelled" && (
                  <>
                    <Button size="sm" variant="secondary" className="mr-2" onClick={() => respond(m.id, "Accepted")}>
                      Accept
                    </Button>
                    <Button size="sm" variant="danger" className="mr-2" onClick={() => respond(m.id, "Declined")}>
                      Decline
                    </Button>
                  </>
                )}
                <Link to={`/meetings/${m.id}`} className="text-sm text-brand-700 hover:underline">
                  Open
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="My Meetings"
        description="Meetings you organize or are invited to."
        actions={
          <Link to="/meetings/new">
            <Button>Schedule a meeting</Button>
          </Link>
        }
      />

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <>
          <Card title="Organized by me">{renderTable(organized, false)}</Card>
          <Card title="I'm invited to">{renderTable(invited, true)}</Card>
        </>
      )}
    </div>
  );
}
