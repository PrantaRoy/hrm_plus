import { useNavigate } from "react-router-dom";
import { PageHeader } from "@hrm-plus/ui";
import { createAttendanceLocation } from "../../api/attendanceLocations";
import { AttendanceLocationForm } from "./AttendanceLocationForm";

export default function AttendanceLocationCreate() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="New Attendance Location" description="Define a location and radius staff can check in from." />
      <AttendanceLocationForm
        submitLabel="Create Location"
        onSubmit={async (input) => {
          await createAttendanceLocation(input);
          navigate("/settings/attendance-locations");
        }}
      />
    </div>
  );
}
