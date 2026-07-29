import { useNavigate } from "react-router-dom";
import { PageHeader } from "@hrm-plus/ui";
import { createDutySchedule } from "../../api/dutySchedules";
import { DutyScheduleForm } from "./DutyScheduleForm";

export default function DutyScheduleCreate() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="New Duty Schedule" description="Define a new shift/duty schedule." />
      <DutyScheduleForm
        submitLabel="Create Duty Schedule"
        onSubmit={async (input) => {
          await createDutySchedule(input);
          navigate("/duty-schedules");
        }}
      />
    </div>
  );
}
