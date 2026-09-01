import { AvailabilityReportDto, ParticipantConflictDto } from "@hrm-plus/shared";

export default function ConflictList({ report }: { report: AvailabilityReportDto }) {
  if (report.conflicts.length === 0) {
    return (
      <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
        All participants are available for this slot.
      </div>
    );
  }
  const rowClass = (c: ParticipantConflictDto) =>
    c.severity === "BLOCK"
      ? "text-red-700 bg-red-50 border-red-200"
      : "text-amber-700 bg-amber-50 border-amber-200";
  return (
    <ul className="space-y-2">
      {report.conflicts.map((c, i) => (
        <li key={i} className={`text-sm border rounded-md px-3 py-2 ${rowClass(c)}`}>
          <span className="font-medium">{c.severity === "BLOCK" ? "Blocked" : "Warning"}:</span> {c.message}
        </li>
      ))}
    </ul>
  );
}
