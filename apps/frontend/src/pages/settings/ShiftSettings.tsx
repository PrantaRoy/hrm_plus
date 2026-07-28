import { createShift, deleteShift, listShifts, updateShift } from "../../api/shifts";
import SettingsCrudPage from "./SettingsCrudPage";

export default function ShiftSettings() {
  return (
    <SettingsCrudPage
      title="Shifts"
      fields={[
        { key: "name", label: "Shift name", type: "text" },
        { key: "startTime", label: "Start time", type: "time" },
        { key: "endTime", label: "End time", type: "time" },
        { key: "status", label: "Status", type: "status" },
      ]}
      emptyForm={{ name: "", startTime: "09:00", endTime: "17:00", status: "Active" }}
      list={listShifts}
      create={(input) => createShift(input as any)}
      update={(id, input) => updateShift(id, input as any)}
      remove={deleteShift}
    />
  );
}
