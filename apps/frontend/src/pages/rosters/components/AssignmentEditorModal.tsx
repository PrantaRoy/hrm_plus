import { useEffect, useState } from "react";
import { DutyScheduleDto } from "@hrm-plus/shared";
import { Button, Field, Modal, Select } from "@hrm-plus/ui";
import { formatDutyScheduleOption } from "../../../utils/dutySchedule";

interface AssignmentEditorModalProps {
  open: boolean;
  employeeName: string;
  date: string;
  dutySchedules: DutyScheduleDto[];
  currentDutyScheduleId: number | null;
  busy?: boolean;
  onClose: () => void;
  onSave: (dutyScheduleId: number | null) => void;
}

function formatDateLabel(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function AssignmentEditorModal({
  open,
  employeeName,
  date,
  dutySchedules,
  currentDutyScheduleId,
  busy,
  onClose,
  onSave,
}: AssignmentEditorModalProps) {
  const [dutyScheduleId, setDutyScheduleId] = useState<string>(
    currentDutyScheduleId ? String(currentDutyScheduleId) : ""
  );

  useEffect(() => {
    setDutyScheduleId(currentDutyScheduleId ? String(currentDutyScheduleId) : "");
  }, [currentDutyScheduleId, date, employeeName, open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={employeeName}
      description={formatDateLabel(date)}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            isLoading={busy}
            onClick={() => onSave(dutyScheduleId ? Number(dutyScheduleId) : null)}
          >
            Save
          </Button>
        </>
      }
    >
      <Field label="Duty schedule">
        <Select value={dutyScheduleId} onChange={(e) => setDutyScheduleId(e.target.value)}>
          <option value="">— No duty schedule (Off) —</option>
          {dutySchedules.map((d) => (
            <option key={d.id} value={d.id}>
              {formatDutyScheduleOption(d)}
            </option>
          ))}
        </Select>
      </Field>
    </Modal>
  );
}
