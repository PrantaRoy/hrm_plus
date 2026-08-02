import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { AttendanceLocationDto } from "@hrm-plus/shared";
import {
  Button,
  EmptyState,
  Spinner,
  StatusPill,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@hrm-plus/ui";
import { deleteAttendanceLocation, listAttendanceLocations } from "../../api/attendanceLocations";

export default function AttendanceLocationList() {
  const [locations, setLocations] = useState<AttendanceLocationDto[] | null>(null);

  function refresh() {
    listAttendanceLocations().then(setLocations);
  }

  useEffect(refresh, []);

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this location?")) return;
    await deleteAttendanceLocation(id);
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Attendance Locations</h2>
        <Link
          to="/settings/attendance-locations/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add Location
        </Link>
      </div>

      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Latitude</TableHeaderCell>
            <TableHeaderCell>Longitude</TableHeaderCell>
            <TableHeaderCell>Radius</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </tr>
        </TableHead>
        <tbody>
          {!locations && (
            <tr>
              <td colSpan={6} className="py-12">
                <div className="flex justify-center">
                  <Spinner />
                </div>
              </td>
            </tr>
          )}
          {locations && locations.length === 0 && (
            <tr>
              <td colSpan={6}>
                <EmptyState title="No locations yet" description="Add your first location to get started." />
              </td>
            </tr>
          )}
          {locations?.map((location) => (
            <TableRow key={location.id}>
              <TableCell className="font-medium text-slate-900">{location.name}</TableCell>
              <TableCell>{location.latitude}</TableCell>
              <TableCell>{location.longitude}</TableCell>
              <TableCell>{location.radiusMeters}m</TableCell>
              <TableCell>
                <StatusPill status={location.status} />
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                <Link
                  to={`/settings/attendance-locations/${location.id}/edit`}
                  className="mr-3 text-sm text-brand-600 hover:underline"
                >
                  Edit
                </Link>
                <Button size="sm" variant="danger" onClick={() => handleDelete(location.id)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
