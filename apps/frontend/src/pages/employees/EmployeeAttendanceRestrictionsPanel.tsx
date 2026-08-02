import { useEffect, useState } from "react";
import { AttendanceIpRuleDto, AttendanceLocationDto, EmployeeAttendanceDeviceDto } from "@hrm-plus/shared";
import { Badge, Button, Card, Checkbox, Spinner } from "@hrm-plus/ui";
import {
  approveAttendanceDevice,
  getEmployeeAttendanceRules,
  listEmployeeAttendanceDevices,
  rejectAttendanceDevice,
  setEmployeeAttendanceRules,
} from "../../api/attendance";
import { listAttendanceIpRules } from "../../api/attendanceIpRules";
import { listAttendanceLocations } from "../../api/attendanceLocations";

function deviceStatusColor(status: string): "green" | "amber" | "red" | "slate" {
  if (status === "Approved") return "green";
  if (status === "Pending") return "amber";
  if (status === "Rejected") return "red";
  return "slate";
}

export function EmployeeAttendanceRestrictionsPanel({ employeeId }: { employeeId: number }) {
  const [ipRules, setIpRules] = useState<AttendanceIpRuleDto[]>([]);
  const [locations, setLocations] = useState<AttendanceLocationDto[]>([]);
  const [devices, setDevices] = useState<EmployeeAttendanceDeviceDto[]>([]);

  const [ipBindingEnabled, setIpBindingEnabled] = useState(false);
  const [locationBindingEnabled, setLocationBindingEnabled] = useState(false);
  const [deviceBindingEnabled, setDeviceBindingEnabled] = useState(false);
  const [selectedIpRuleIds, setSelectedIpRuleIds] = useState<number[]>([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function refreshDevices() {
    listEmployeeAttendanceDevices(employeeId).then(setDevices).catch(() => setDevices([]));
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([
      listAttendanceIpRules(),
      listAttendanceLocations(),
      getEmployeeAttendanceRules(employeeId),
      listEmployeeAttendanceDevices(employeeId),
    ])
      .then(([rules, locs, employeeRules, employeeDevices]) => {
        setIpRules(rules);
        setLocations(locs);
        setIpBindingEnabled(employeeRules.ipBindingEnabled);
        setLocationBindingEnabled(employeeRules.locationBindingEnabled);
        setDeviceBindingEnabled(employeeRules.deviceBindingEnabled);
        setSelectedIpRuleIds(employeeRules.ipRuleIds);
        setSelectedLocationIds(employeeRules.locationIds);
        setDevices(employeeDevices);
      })
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load attendance restrictions"))
      .finally(() => setLoading(false));
  }, [employeeId]);

  function toggleId(list: number[], id: number, checked: boolean): number[] {
    return checked ? [...list, id] : list.filter((x) => x !== id);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const result = await setEmployeeAttendanceRules(employeeId, {
        ipBindingEnabled,
        locationBindingEnabled,
        deviceBindingEnabled,
        ipRuleIds: selectedIpRuleIds,
        locationIds: selectedLocationIds,
      });
      setIpBindingEnabled(result.ipBindingEnabled);
      setLocationBindingEnabled(result.locationBindingEnabled);
      setDeviceBindingEnabled(result.deviceBindingEnabled);
      setSelectedIpRuleIds(result.ipRuleIds);
      setSelectedLocationIds(result.locationIds);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to save attendance restrictions");
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(deviceId: number) {
    setError(null);
    try {
      await approveAttendanceDevice(employeeId, deviceId);
      refreshDevices();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to approve device");
    }
  }

  async function handleReject(deviceId: number) {
    setError(null);
    try {
      await rejectAttendanceDevice(employeeId, deviceId);
      refreshDevices();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to reject device");
    }
  }

  return (
    <Card
      title="Attendance restrictions"
      description="Optionally pin this staff member's check-in/out to approved networks, locations, or devices."
    >
      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-5">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
          )}
          {saved && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
              Attendance restrictions saved.
            </div>
          )}

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Checkbox checked={ipBindingEnabled} onChange={(e) => setIpBindingEnabled(e.target.checked)} />
              Require an approved network (IP binding)
            </label>
            {ipBindingEnabled && (
              <div className="ml-6 space-y-1">
                {ipRules.length === 0 && (
                  <p className="text-xs text-slate-400">
                    No IP rules configured yet. Add one in Settings → IP Rules first.
                  </p>
                )}
                {ipRules.map((rule) => (
                  <label key={rule.id} className="flex items-center gap-2 text-sm text-slate-600">
                    <Checkbox
                      checked={selectedIpRuleIds.includes(rule.id)}
                      onChange={(e) => setSelectedIpRuleIds((prev) => toggleId(prev, rule.id, e.target.checked))}
                    />
                    {rule.label} ({rule.cidr})
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Checkbox
                checked={locationBindingEnabled}
                onChange={(e) => setLocationBindingEnabled(e.target.checked)}
              />
              Require an approved location (GPS radius)
            </label>
            {locationBindingEnabled && (
              <div className="ml-6 space-y-1">
                {locations.length === 0 && (
                  <p className="text-xs text-slate-400">
                    No locations configured yet. Add one in Settings → Locations first.
                  </p>
                )}
                {locations.map((location) => (
                  <label key={location.id} className="flex items-center gap-2 text-sm text-slate-600">
                    <Checkbox
                      checked={selectedLocationIds.includes(location.id)}
                      onChange={(e) =>
                        setSelectedLocationIds((prev) => toggleId(prev, location.id, e.target.checked))
                      }
                    />
                    {location.name} ({location.radiusMeters}m radius)
                  </label>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Checkbox checked={deviceBindingEnabled} onChange={(e) => setDeviceBindingEnabled(e.target.checked)} />
            Require an approved device
          </label>

          <Button size="sm" onClick={handleSave} isLoading={saving}>
            Save
          </Button>

          <div className="space-y-2 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-medium text-slate-700">Registered devices</h3>
            {devices.length === 0 && <p className="text-xs text-slate-400">No devices have checked in yet.</p>}
            {devices.map((device) => (
              <div key={device.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-mono text-xs text-slate-600">
                    …{device.deviceToken.slice(-8)}
                  </span>
                  <Badge color={deviceStatusColor(device.status)} className="ml-2">
                    {device.status}
                  </Badge>
                  {device.lastSeenAt && (
                    <span className="ml-2 text-xs text-slate-400">
                      last seen {new Date(device.lastSeenAt).toLocaleString()}
                      {device.lastSeenIp ? ` (${device.lastSeenIp})` : ""}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {device.status !== "Approved" && (
                    <Button size="sm" onClick={() => handleApprove(device.id)}>
                      Approve
                    </Button>
                  )}
                  {device.status !== "Rejected" && (
                    <Button size="sm" variant="danger" onClick={() => handleReject(device.id)}>
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
