import { RoleDto } from "@hrm-plus/shared";
import { createRole, deleteRole, listRoles, updateRole } from "../../api/roles";
import SettingsCrudPage from "./SettingsCrudPage";

export default function RoleSettings() {
  return (
    <SettingsCrudPage<RoleDto>
      title="Roles"
      fields={[
        { key: "name", label: "Name", type: "text" },
        { key: "shortDescription", label: "Short description", type: "text" },
        { key: "status", label: "Status", type: "status" },
      ]}
      emptyForm={{ name: "", shortDescription: "", status: "Active" }}
      list={listRoles}
      create={(input) => createRole(input as any)}
      update={(id, input) => updateRole(id, input as any)}
      remove={deleteRole}
      isLocked={(role) => role.isSystem}
    />
  );
}
