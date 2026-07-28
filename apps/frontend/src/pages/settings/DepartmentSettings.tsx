import { createDepartment, deleteDepartment, listDepartments, updateDepartment } from "../../api/departments";
import SettingsCrudPage from "./SettingsCrudPage";

export default function DepartmentSettings() {
  return (
    <SettingsCrudPage
      title="Departments"
      fields={[
        { key: "name", label: "Name", type: "text" },
        { key: "shortDescription", label: "Short description", type: "text" },
        { key: "status", label: "Status", type: "status" },
      ]}
      emptyForm={{ name: "", shortDescription: "", status: "Active" }}
      list={listDepartments}
      create={(input) => createDepartment(input as any)}
      update={(id, input) => updateDepartment(id, input as any)}
      remove={deleteDepartment}
    />
  );
}
