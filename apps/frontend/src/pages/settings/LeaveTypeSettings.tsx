import { createLeaveType, deleteLeaveType, listLeaveTypes, updateLeaveType } from "../../api/leaveTypes";
import SettingsCrudPage from "./SettingsCrudPage";

export default function LeaveTypeSettings() {
  return (
    <SettingsCrudPage
      title="Leave Types"
      fields={[
        { key: "name", label: "Name", type: "text" },
        { key: "assignedDays", label: "Assigned days", type: "number" },
        { key: "status", label: "Status", type: "status" },
      ]}
      emptyForm={{ name: "", assignedDays: 0, status: "Active" }}
      list={listLeaveTypes}
      create={(input) => createLeaveType(input as any)}
      update={(id, input) => updateLeaveType(id, input as any)}
      remove={deleteLeaveType}
    />
  );
}
