import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, Spinner } from "@hrm-plus/ui";
import { getDutySchedule, updateDutySchedule } from "../../api/dutySchedules";
import { DutyScheduleForm, DutyScheduleFormValues } from "./DutyScheduleForm";

export default function DutyScheduleEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState<DutyScheduleFormValues | null>(null);

  useEffect(() => {
    if (!id) return;
    getDutySchedule(Number(id)).then((dto) =>
      setInitialValues({
        name: dto.name,
        startTime: dto.startTime,
        endTime: dto.endTime,
        checkinConsiderMinutes: String(dto.checkinConsiderMinutes),
        checkoutConsiderMinutes: String(dto.checkoutConsiderMinutes),
        maxOverTimeMinutes: String(dto.maxOverTimeMinutes),
        earlyCheckinBufferMinutes: String(dto.earlyCheckinBufferMinutes),
        isTardyApplicable: dto.isTardyApplicable,
        status: dto.status,
        shortDescription: dto.shortDescription ?? "",
      })
    );
  }, [id]);

  if (!initialValues) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="Edit Duty Schedule" description="Update this shift/duty schedule." />
      <DutyScheduleForm
        initialValues={initialValues}
        submitLabel="Save Changes"
        onSubmit={async (input) => {
          await updateDutySchedule(Number(id), input);
          navigate("/duty-schedules");
        }}
      />
    </div>
  );
}
