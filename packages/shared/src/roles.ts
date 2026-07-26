export const ROLES = ["Admin", "HR", "Manager", "Staff"] as const;

export type RoleName = (typeof ROLES)[number];

export function isRoleName(value: string): value is RoleName {
  return (ROLES as readonly string[]).includes(value);
}
