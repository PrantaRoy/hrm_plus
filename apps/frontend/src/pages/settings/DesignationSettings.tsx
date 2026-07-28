import { createDesignation, deleteDesignation, listDesignations, updateDesignation } from "../../api/designations";
import SettingsCrudPage from "./SettingsCrudPage";

export default function DesignationSettings() {
  return (
    <SettingsCrudPage
      title="Designations"
      fields={[
        { key: "name", label: "Name", type: "text" },
        { key: "shortDescription", label: "Short description", type: "text" },
        { key: "status", label: "Status", type: "status" },
      ]}
      emptyForm={{ name: "", shortDescription: "", status: "Active" }}
      list={listDesignations}
      create={(input) => createDesignation(input as any)}
      update={(id, input) => updateDesignation(id, input as any)}
      remove={deleteDesignation}
    />
  );
}
