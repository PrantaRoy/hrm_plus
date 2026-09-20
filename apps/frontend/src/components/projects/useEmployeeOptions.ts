import { useEffect, useState } from "react";
import { EmployeeDto } from "@hrm-plus/shared";
import { listEmployees } from "../../api/employees";

export interface EmployeeOption {
  id: number;
  name: string;
}

let cache: EmployeeOption[] | null = null;

/** Active employees for pickers. Fetched once per page load and shared between forms. */
export function useEmployeeOptions(): { options: EmployeeOption[]; loading: boolean; failed: boolean } {
  const [options, setOptions] = useState<EmployeeOption[]>(cache ?? []);
  const [loading, setLoading] = useState(cache === null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (cache) return;
    listEmployees({ pageSize: 500 })
      .then((res) => {
        cache = res.items
          .filter((e: EmployeeDto) => e.status === "Active")
          .map((e: EmployeeDto) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));
        setOptions(cache);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  return { options, loading, failed };
}
