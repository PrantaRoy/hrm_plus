import {
  createAttendanceIpRule,
  deleteAttendanceIpRule,
  listAttendanceIpRules,
  updateAttendanceIpRule,
} from "../../api/attendanceIpRules";
import SettingsCrudPage from "./SettingsCrudPage";

export default function AttendanceIpRuleSettings() {
  return (
    <SettingsCrudPage
      title="IP Rules"
      fields={[
        { key: "label", label: "Label", type: "text" },
        { key: "cidr", label: "IP / CIDR", type: "text" },
        { key: "status", label: "Status", type: "status" },
      ]}
      emptyForm={{ label: "", cidr: "", status: "Active" }}
      list={listAttendanceIpRules}
      create={(input) => createAttendanceIpRule(input as any)}
      update={(id, input) => updateAttendanceIpRule(id, input as any)}
      remove={deleteAttendanceIpRule}
    />
  );
}
