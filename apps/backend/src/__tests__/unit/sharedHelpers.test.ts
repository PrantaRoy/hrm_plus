import { ROLES, extractTenantSlug, isRoleName } from "@hrm-plus/shared";

describe("extractTenantSlug", () => {
  const base = "hrmplus.test";

  it.each([
    ["acme.hrmplus.test", "acme"],
    ["ACME.HrmPlus.Test", "acme"],
    ["acme.hrmplus.test:5173", "acme"],
    ["my-company.hrmplus.test", "my-company"],
  ])("%s -> %s", (host, slug) => {
    expect(extractTenantSlug(host, base)).toBe(slug);
  });

  it.each([
    ["hrmplus.test", "the bare base domain"],
    ["localhost", "a foreign host"],
    ["acme.example.com", "a different domain"],
    ["evilhrmplus.test", "a suffix look-alike"],
    ["a.b.hrmplus.test", "nested subdomains"],
    ["www.hrmplus.test", "reserved www"],
    ["app.hrmplus.test", "reserved app"],
    ["admin.hrmplus.test", "reserved admin"],
    ["api.hrmplus.test", "reserved api"],
    ["", "an empty host"],
  ])("%j yields null (%s)", (host) => {
    expect(extractTenantSlug(host, base)).toBeNull();
  });

  it("is case-insensitive about the base domain", () => {
    expect(extractTenantSlug("acme.hrmplus.test", "HRMPLUS.TEST")).toBe("acme");
  });
});

describe("roles", () => {
  it("lists the six built-in roles", () => {
    expect([...ROLES]).toEqual(["Admin", "HR", "Manager", "Staff", "Payroll", "Finance"]);
  });

  it("isRoleName accepts any non-blank string and rejects blanks", () => {
    expect(isRoleName("Admin")).toBe(true);
    expect(isRoleName("Custom Role")).toBe(true);
    expect(isRoleName("")).toBe(false);
    expect(isRoleName("   ")).toBe(false);
  });
});
