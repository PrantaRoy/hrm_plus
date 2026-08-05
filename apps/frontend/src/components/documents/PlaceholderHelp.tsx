const PLACEHOLDER_GROUPS: { label: string; tokens: string[] }[] = [
  {
    label: "Employee",
    tokens: [
      "{{employee.fullName}}",
      "{{employee.firstName}}",
      "{{employee.lastName}}",
      "{{employee.employeeCode}}",
      "{{employee.jobTitle}}",
      "{{employee.email}}",
      "{{employee.department}}",
      "{{employee.designation}}",
      "{{employee.joiningDate}}",
    ],
  },
  {
    label: "Company",
    tokens: ["{{company.name}}", "{{company.logoUrl}}"],
  },
  {
    label: "Request",
    tokens: ["{{request.reason}}", "{{request.priority}}", "{{request.deadlineDate}}", "{{currentDate}}"],
  },
  {
    label: "Issuance (final document only)",
    tokens: ["{{referenceNumber}}", "{{qrCode}}"],
  },
  {
    label: "Signatures",
    tokens: ["{{signature:ReportingManager}}", "{{signature:HR}}", "{{signature:Admin}}"],
  },
  {
    label: "Custom fields (e.g. payslip figures set by HR)",
    tokens: ["{{fieldValues.basicSalary}}", "{{fieldValues.netPay}}"],
  },
];

export function PlaceholderHelp({ onInsert }: { onInsert: (token: string) => void }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
      <p className="mb-2 font-medium text-slate-700">Available placeholders — click to insert</p>
      <div className="space-y-2">
        {PLACEHOLDER_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{group.label}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {group.tokens.map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => onInsert(token)}
                  className="rounded border border-slate-300 bg-white px-2 py-0.5 font-mono text-xs text-slate-700 hover:border-brand-400 hover:text-brand-700"
                >
                  {token}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        A "Role" approval step's signature placeholder is <code className="font-mono">{"{{signature:<RoleName>}}"}</code>{" "}
        — match it to the role name you chose for that step.
      </p>
    </div>
  );
}
