const findUnique = jest.fn();
const getTenantClient = jest.fn((name: string) => ({ __client: name }));
jest.mock("../../db/controlClient", () => ({ controlClient: { tenant: { findUnique: (a: unknown) => findUnique(a) } } }));
jest.mock("../../db/tenantClientPool", () => ({ getTenantClient: (n: string) => getTenantClient(n) }));
jest.mock("../../config/env", () => ({ env: { PUBLIC_TENANT_BASE_DOMAIN: "hrmplus.test" } }));

import { Request, Response } from "express";
import { TENANT_HEADER } from "@hrm-plus/shared";
import { tenantResolver } from "../../middleware/tenantResolver";

async function resolve(headers: Record<string, string>, hostname: string) {
  const req = {
    hostname,
    header: (n: string) => headers[n],
  } as unknown as Request;
  const next = jest.fn();
  await tenantResolver(req, {} as Response, next);
  return { req, next };
}

describe("tenantResolver", () => {
  beforeEach(() => {
    findUnique.mockReset();
    getTenantClient.mockClear();
  });

  it("prefers the tenant header over the hostname", async () => {
    findUnique.mockResolvedValue({ id: 1, slug: "acme", databaseName: "hrm_acme", status: "Active" });
    const { req, next } = await resolve({ [TENANT_HEADER]: "acme" }, "other.hrmplus.test");
    expect(findUnique).toHaveBeenCalledWith({ where: { slug: "acme" } });
    expect(req.tenant).toEqual({ id: 1, slug: "acme", databaseName: "hrm_acme" });
    expect(req.prisma).toEqual({ __client: "hrm_acme" });
    expect(next).toHaveBeenCalledWith();
  });

  it("falls back to the subdomain when no header is sent", async () => {
    findUnique.mockResolvedValue({ id: 2, slug: "beta", databaseName: "hrm_beta", status: "Active" });
    await resolve({}, "beta.hrmplus.test");
    expect(findUnique).toHaveBeenCalledWith({ where: { slug: "beta" } });
  });

  it("answers 400 TENANT_REQUIRED when neither header nor subdomain identify a tenant", async () => {
    const { next } = await resolve({}, "localhost");
    expect(next.mock.calls[0][0]).toMatchObject({ status: 400, code: "TENANT_REQUIRED" });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("answers 404 for an unknown tenant", async () => {
    findUnique.mockResolvedValue(null);
    const { next } = await resolve({ [TENANT_HEADER]: "ghost" }, "x");
    expect(next.mock.calls[0][0]).toMatchObject({ status: 404 });
  });

  it.each(["Suspended", "Pending", "Inactive"])("answers 404 for a %s tenant (no existence leak)", async (status) => {
    findUnique.mockResolvedValue({ id: 3, slug: "s", databaseName: "d", status });
    const { next } = await resolve({ [TENANT_HEADER]: "s" }, "x");
    expect(next.mock.calls[0][0]).toMatchObject({ status: 404 });
    expect(getTenantClient).not.toHaveBeenCalled();
  });

  it("forwards unexpected lookup failures to next()", async () => {
    findUnique.mockRejectedValue(new Error("db down"));
    const { next } = await resolve({ [TENANT_HEADER]: "acme" }, "x");
    expect(next.mock.calls[0][0]).toMatchObject({ message: "db down" });
  });
});
