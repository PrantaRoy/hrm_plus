jest.mock("../../config/env", () => ({
  env: {
    JWT_ACCESS_SECRET: "access-secret",
    JWT_ACCESS_TTL: "30m",
    JWT_REFRESH_SECRET: "refresh-secret",
    JWT_REFRESH_TTL: "7d",
    JWT_SAAS_ACCESS_SECRET: "saas-secret",
    JWT_SAAS_ACCESS_TTL: "30m",
  },
}));

import jwt from "jsonwebtoken";
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "../../modules/auth/jwt";
import { signSaasAdminToken, verifySaasAdminToken } from "../../modules/saas/saasAuth/saasAuth.jwt";

const payload = { sub: 5, tenantSlug: "acme", role: "HR", email: "jane@acme.test" };

describe("tenant access/refresh tokens", () => {
  it("round-trips the access payload", () => {
    expect(verifyAccessToken(signAccessToken(payload))).toMatchObject(payload);
  });

  it("round-trips the refresh payload", () => {
    expect(verifyRefreshToken(signRefreshToken({ sub: 5, tenantSlug: "acme" }))).toMatchObject({ sub: 5, tenantSlug: "acme" });
  });

  it("sets an expiry from the configured TTL", () => {
    const decoded = jwt.decode(signAccessToken(payload)) as { iat: number; exp: number };
    expect(decoded.exp - decoded.iat).toBe(30 * 60);
    const refresh = jwt.decode(signRefreshToken({ sub: 1, tenantSlug: "a" })) as { iat: number; exp: number };
    expect(refresh.exp - refresh.iat).toBe(7 * 24 * 3600);
  });

  it("keeps access and refresh secrets separate", () => {
    expect(() => verifyAccessToken(signRefreshToken({ sub: 1, tenantSlug: "a" }))).toThrow();
    expect(() => verifyRefreshToken(signAccessToken(payload))).toThrow();
  });

  it("rejects tampered, foreign-signed and expired tokens", () => {
    const token = signAccessToken(payload);
    expect(() => verifyAccessToken(token.slice(0, -2) + "xx")).toThrow();
    expect(() => verifyAccessToken(jwt.sign(payload, "wrong-secret"))).toThrow();
    expect(() => verifyAccessToken(jwt.sign(payload, "access-secret", { expiresIn: -10 }))).toThrow(/expired/);
  });

  it("rejects an unsigned (alg=none) token", () => {
    const none = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    expect(() => verifyAccessToken(`${none}.${body}.`)).toThrow();
  });
});

describe("SaaS admin tokens", () => {
  it("round-trips and stamps the saas-admin scope", () => {
    const decoded = verifySaasAdminToken(signSaasAdminToken({ sub: 1, email: "root@saas.test" }));
    expect(decoded).toMatchObject({ sub: 1, email: "root@saas.test", scope: "saas-admin" });
  });

  it("cannot be used as a tenant access token or vice versa", () => {
    expect(() => verifyAccessToken(signSaasAdminToken({ sub: 1, email: "e" }))).toThrow();
    expect(() => verifySaasAdminToken(signAccessToken(payload))).toThrow();
  });

  it("rejects a correctly signed token with the wrong scope", () => {
    const wrongScope = jwt.sign({ sub: 1, email: "e", scope: "tenant" }, "saas-secret");
    expect(() => verifySaasAdminToken(wrongScope)).toThrow("Invalid token scope");
    const noScope = jwt.sign({ sub: 1, email: "e" }, "saas-secret");
    expect(() => verifySaasAdminToken(noScope)).toThrow("Invalid token scope");
  });
});
