import { createWeekDay, deleteWeekDay, listWeekDays, updateWeekDay } from "../../api/weekdays";
import SettingsCrudPage from "./SettingsCrudPage";

export default function WeekDaySettings() {
  return (
    <SettingsCrudPage
      title="Week Days"
      fields={[
        { key: "name", label: "Name", type: "text" },
        { key: "isWeekend", label: "Weekend day", type: "boolean" },
      ]}
      emptyForm={{ name: "", isWeekend: false }}
      list={listWeekDays}
      create={(input) => createWeekDay(input as any)}
      update={(id, input) => updateWeekDay(id, input as any)}
      remove={deleteWeekDay}
    />
  );
}
