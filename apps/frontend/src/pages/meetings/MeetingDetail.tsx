import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MeetingDto } from "@hrm-plus/shared";
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
import { cancelMeeting, confirmMeeting, getMeeting, respondToMeeting } from "../../api/meetings";
import { apiErrorMessage } from "../../utils/apiError";

export default function MeetingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const meetingId = Number(id);
  const [meeting, setMeeting] = useState<MeetingDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ack, setAck] = useState(false);

  function refresh() {
    setLoading(true);
    getMeeting(meetingId)
      .then(setMeeting)
      .catch((err) => setError(apiErrorMessage(err, "Failed to load meeting")))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [meetingId]);

  async function doConfirm() {
    setBusy(true);
    setError(null);
    try {
      setMeeting(await confirmMeeting(meetingId, { acknowledgeWarnings: ack }));
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to confirm meeting"));
    } finally {
      setBusy(false);
    }
  }

  async function doCancel() {
    if (!window.confirm("Cancel this meeting?")) return;
    setBusy(true);
    setError(null);
    try {
      setMeeting(await cancelMeeting(meetingId));
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to cancel meeting"));
    } finally {
      setBusy(false);
    }
  }

  async function respond(response: "Accepted" | "Declined") {
    setBusy(true);
    setError(null);
    try {
      setMeeting(await respondToMeeting(meetingId, { response }));
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to respond"));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;
  if (!meeting)
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{error ?? "Meeting not found"}</p>
        <Button variant="secondary" onClick={() => navigate("/meetings")}>
          Back to meetings
        </Button>
      </div>
    );

  const snapshot = meeting.conflictSnapshot;

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader
        title={meeting.title}
        description={`Organized by ${meeting.organizerName}`}
        actions={<StatusPill status={meeting.status} />}
      />

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}

      <Card>
        <dl className="grid grid-cols-3 gap-y-2 text-sm">
          <dt className="text-slate-500">When</dt>
          <dd className="col-span-2 text-slate-800">
            {new Date(meeting.startAt).toLocaleString()} – {new Date(meeting.endAt).toLocaleTimeString()}
          </dd>
          {meeting.locationText && (
            <>
              <dt className="text-slate-500">Location</dt>
              <dd className="col-span-2 text-slate-800">{meeting.locationText}</dd>
            </>
          )}
          {meeting.description && (
            <>
              <dt className="text-slate-500">Details</dt>
              <dd className="col-span-2 whitespace-pre-wrap text-slate-800">{meeting.description}</dd>
            </>
          )}
          {meeting.cancelReason && (
            <>
              <dt className="text-slate-500">Cancel reason</dt>
              <dd className="col-span-2 text-slate-800">{meeting.cancelReason}</dd>
            </>
          )}
        </dl>
      </Card>

      <Card title="Participants">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Department</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Response</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {meeting.participants.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.employeeName}</TableCell>
                <TableCell>{p.departmentName ?? "—"}</TableCell>
                <TableCell>{p.isRequired ? "Required" : "Optional"}</TableCell>
                <TableCell>
                  <StatusPill status={p.responseStatus} />
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </Card>

      {snapshot && snapshot.conflicts.length > 0 && (
        <Card title="Acknowledged warnings at confirmation">
          <ul className="space-y-1 text-sm text-amber-700">
            {snapshot.conflicts.map((c, i) => (
              <li key={i}>• {c.message}</li>
            ))}
          </ul>
        </Card>
      )}

      {meeting.status !== "Cancelled" && (
        <Card title="Actions">
          <div className="space-y-3">
            {meeting.viewerCanManage && meeting.status === "Draft" && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
                  Acknowledge any scheduling warnings
                </label>
                <Button onClick={doConfirm} isLoading={busy}>
                  Confirm meeting
                </Button>
              </div>
            )}
            {meeting.viewerCanManage && (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => navigate(`/meetings/${meeting.id}/edit`)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={doCancel} isLoading={busy}>
                  Cancel meeting
                </Button>
              </div>
            )}
            {meeting.viewerIsParticipant && (
              <div className="flex gap-2 pt-1">
                <span className="text-sm text-slate-500 self-center">Your RSVP:</span>
                <Button size="sm" variant="secondary" onClick={() => respond("Accepted")}>
                  Accept
                </Button>
                <Button size="sm" variant="danger" onClick={() => respond("Declined")}>
                  Decline
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
