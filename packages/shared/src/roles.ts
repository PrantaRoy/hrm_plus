// Built-in, protected role names — seeded for every tenant and relied on by
// requireRole() call sites. These cannot be renamed or deleted via Role CRUD.
export const ROLES = ["Admin", "HR", "Manager", "Staff"] as const;

// Role names are otherwise dynamic (managed via the Role CRUD module), so this
// is just a string alias rather than a literal union of ROLES.
export type RoleName = string;

export function isRoleName(value: string): value is RoleName {
  return typeof value === "string" && value.trim().length > 0;
}
