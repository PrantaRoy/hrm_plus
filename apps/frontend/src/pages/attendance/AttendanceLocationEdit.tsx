import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, Spinner } from "@hrm-plus/ui";
import { getAttendanceLocation, updateAttendanceLocation } from "../../api/attendanceLocations";
import { AttendanceLocationForm, AttendanceLocationFormValues } from "./AttendanceLocationForm";

export default function AttendanceLocationEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState<AttendanceLocationFormValues | null>(null);

  useEffect(() => {
    if (!id) return;
    getAttendanceLocation(Number(id)).then((dto) =>
      setInitialValues({
        name: dto.name,
        latitude: String(dto.latitude),
        longitude: String(dto.longitude),
        radiusMeters: String(dto.radiusMeters),
        status: dto.status,
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
      <PageHeader title="Edit Attendance Location" description="Update this location and radius." />
      <AttendanceLocationForm
        initialValues={initialValues}
        submitLabel="Save Changes"
        onSubmit={async (input) => {
          await updateAttendanceLocation(Number(id), input);
          navigate("/settings/attendance-locations");
        }}
      />
    </div>
  );
}
