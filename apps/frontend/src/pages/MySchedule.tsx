import { PageHeader } from "@hrm-plus/ui";
import { DutyScheduleMonthCalendar } from "../components/DutyScheduleMonthCalendar";

export default function MySchedule() {
  return (
    <div className="space-y-5">
      <PageHeader title="My Duty Schedule" description="Your approved duty assignments." />
      <DutyScheduleMonthCalendar />
    </div>
  );
}
