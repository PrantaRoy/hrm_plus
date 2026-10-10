const verifyAccessToken = jest.fn();
jest.mock("../../modules/auth/jwt", () => ({ verifyAccessToken: (t: string) => verifyAccessToken(t) }));

import { Request, Response } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";

function run(handler: (req: Request, res: Response, next: jest.Mock) => void, req: Partial<Request>) {
  const next = jest.fn();
  handler(req as Request, {} as Response, next);
  return next;
}

const reqWith = (authorization: string | undefined, tenantSlug: string | null = "acme"): Partial<Request> => ({
  header: ((name: string) => (name === "Authorization" ? authorization : undefined)) as Request["header"],
  tenant: tenantSlug ? ({ id: 1, slug: tenantSlug, databaseName: "db" } as Request["tenant"]) : undefined,
});

describe("requireAuth", () => {
  beforeEach(() => verifyAccessToken.mockReset());

  it("rejects a missing Authorization header", () => {
    const next = run(requireAuth, reqWith(undefined));
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401, message: "Missing access token" });
    expect(verifyAccessToken).not.toHaveBeenCalled();
  });

  it("rejects non-Bearer schemes", () => {
    const next = run(requireAuth, reqWith("Basic abc"));
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401, message: "Missing access token" });
  });

  it("rejects an invalid or expired token", () => {
    verifyAccessToken.mockImplementation(() => {
      throw new Error("jwt expired");
    });
    const next = run(requireAuth, reqWith("Bearer bad"));
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401, message: "Invalid or expired token" });
  });

  it("rejects a token issued for a different tenant", () => {
    verifyAccessToken.mockReturnValue({ sub: 1, email: "a@b.c", role: "Admin", tenantSlug: "other" });
    const next = run(requireAuth, reqWith("Bearer t", "acme"));
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401, message: "Token does not match tenant" });
  });

  it("rejects when no tenant was resolved on the request", () => {
    verifyAccessToken.mockReturnValue({ sub: 1, email: "a@b.c", role: "Admin", tenantSlug: "acme" });
    const next = run(requireAuth, reqWith("Bearer t", null));
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401 });
  });

  it("populates req.user and continues on success", () => {
    verifyAccessToken.mockReturnValue({ sub: 7, email: "jane@acme.test", role: "HR", tenantSlug: "acme" });
    const req = reqWith("Bearer good-token");
    const next = run(requireAuth, req);
    expect(verifyAccessToken).toHaveBeenCalledWith("good-token");
    expect(req.user).toEqual({ id: 7, email: "jane@acme.test", role: "HR" });
    expect(next).toHaveBeenCalledWith();
  });
});

describe("requireRole", () => {
  it("returns 401 when unauthenticated", () => {
    const next = run(requireRole("Admin"), {});
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401 });
  });

  it("returns 403 naming the required roles when the role does not match", () => {
    const next = run(requireRole("Admin", "HR"), { user: { id: 1, email: "x", role: "Staff" } });
    expect(next.mock.calls[0][0]).toMatchObject({ status: 403, message: "Requires role: Admin, HR" });
  });

  it("allows any of the listed roles", () => {
    for (const role of ["Admin", "HR"]) {
      const next = run(requireRole("Admin", "HR"), { user: { id: 1, email: "x", role } });
      expect(next).toHaveBeenCalledWith();
    }
  });

  it("is case-sensitive", () => {
    const next = run(requireRole("Admin"), { user: { id: 1, email: "x", role: "admin" } });
    expect(next.mock.calls[0][0]).toMatchObject({ status: 403 });
  });
});
