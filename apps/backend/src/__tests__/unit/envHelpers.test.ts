// Stop dotenv from refilling variables a case deliberately removed, so the real .env never leaks in.
jest.mock("dotenv/config", () => ({}));

// env.ts validates process.env at import time, so each case loads a fresh copy under controlled vars.
const BASE = {
  CONTROL_DATABASE_URL: "mysql://x",
  TENANT_DB_HOST: "db.local",
  TENANT_DB_PORT: "3307",
  TENANT_DB_USER: "root",
  TENANT_DB_PASSWORD: "",
  JWT_ACCESS_SECRET: "a",
  JWT_REFRESH_SECRET: "b",
  JWT_SAAS_ACCESS_SECRET: "c",
  SETTINGS_ENCRYPTION_KEY: "k".repeat(32),
  PUBLIC_TENANT_BASE_DOMAIN: "hrmplus.test",
  CORS_ORIGIN: "http://localhost:5173 , http://localhost:5174",
};

function loadEnv(overrides: Record<string, string | undefined> = {}) {
  const saved = { ...process.env };
  const merged: Record<string, string | undefined> = { ...BASE, ...overrides };
  for (const [k, v] of Object.entries(merged)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    let mod!: typeof import("../../config/env");
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- isolateModules needs a synchronous load
      mod = require("../../config/env");
    });
    return mod;
  } finally {
    process.env = saved;
  }
}

describe("config/env", () => {
  const silence = () => jest.spyOn(console, "error").mockImplementation(() => undefined);

  it("applies defaults for optional settings", () => {
    const { env } = loadEnv({ JWT_ACCESS_TTL: undefined, STORAGE_DRIVER: undefined, LLM_PROVIDER: undefined });
    expect(env.JWT_ACCESS_TTL).toBe("30m");
    expect(env.STORAGE_DRIVER).toBe("local");
    expect(env.LLM_PROVIDER).toBe("groq");
  });

  it.each(["CONTROL_DATABASE_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "JWT_SAAS_ACCESS_SECRET", "TENANT_DB_HOST"])(
    "fails fast when %s is missing",
    (key) => {
      const spy = silence();
      expect(() => loadEnv({ [key]: undefined })).toThrow("Invalid environment configuration");
      spy.mockRestore();
    }
  );

  it("requires SETTINGS_ENCRYPTION_KEY to be at least 32 chars", () => {
    const spy = silence();
    expect(() => loadEnv({ SETTINGS_ENCRYPTION_KEY: "short" })).toThrow("Invalid environment configuration");
    spy.mockRestore();
  });

  it("rejects unknown STORAGE_DRIVER / LLM_PROVIDER values", () => {
    const spy = silence();
    expect(() => loadEnv({ STORAGE_DRIVER: "ftp" })).toThrow();
    expect(() => loadEnv({ LLM_PROVIDER: "skynet" })).toThrow();
    spy.mockRestore();
  });

  it("splits and trims CORS origins", () => {
    expect(loadEnv().corsOrigins).toEqual(["http://localhost:5173", "http://localhost:5174"]);
  });

  describe("isTenantOrigin", () => {
    const { isTenantOrigin } = loadEnv();
    it("accepts the base domain and its subdomains", () => {
      expect(isTenantOrigin("https://hrmplus.test")).toBe(true);
      expect(isTenantOrigin("https://acme.hrmplus.test")).toBe(true);
      expect(isTenantOrigin("http://a.b.hrmplus.test:8080")).toBe(true);
    });
    it("rejects look-alike and unrelated hosts", () => {
      expect(isTenantOrigin("https://evilhrmplus.test")).toBe(false);
      expect(isTenantOrigin("https://hrmplus.test.evil.com")).toBe(false);
      expect(isTenantOrigin("https://example.com")).toBe(false);
    });
    it("rejects malformed origins instead of throwing", () => {
      expect(isTenantOrigin("not a url")).toBe(false);
      expect(isTenantOrigin("")).toBe(false);
    });
  });

  describe("tenantDatabaseUrl", () => {
    it("omits the password section when none is set", () => {
      expect(loadEnv().tenantDatabaseUrl("hrm_acme")).toBe("mysql://root@db.local:3307/hrm_acme");
    });
    it("URL-encodes credentials", () => {
      const { tenantDatabaseUrl } = loadEnv({ TENANT_DB_USER: "app user", TENANT_DB_PASSWORD: "p@ss:w/rd" });
      expect(tenantDatabaseUrl("db")).toBe("mysql://app%20user:p%40ss%3Aw%2Frd@db.local:3307/db");
    });
  });

  it("builds the tenant login URL", () => {
    expect(loadEnv().tenantLoginUrl("acme")).toBe("https://acme.hrmplus.test");
  });
});
