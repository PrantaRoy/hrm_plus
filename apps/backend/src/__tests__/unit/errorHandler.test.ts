const loggerError = jest.fn();
jest.mock("../../logger", () => ({ logger: { error: (...a: unknown[]) => loggerError(...a) } }));

import { Request, Response } from "express";
import { z } from "zod";
import { errorHandler } from "../../middleware/errorHandler";
import { ApiError } from "../../utils/ApiError";

function invoke(err: unknown) {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  errorHandler(err, { path: "/x" } as Request, res as unknown as Response, jest.fn());
  return res;
}

describe("errorHandler", () => {
  beforeEach(() => loggerError.mockClear());

  it("serializes ApiError with status, message and code", () => {
    const res = invoke(ApiError.notFound("Employee not found"));
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: { message: "Employee not found", code: "NOT_FOUND" } });
  });

  it("includes details only when provided", () => {
    const res = invoke(ApiError.conflict("dup", "DUP", { field: "email" }));
    expect(res.json).toHaveBeenCalledWith({ error: { message: "dup", code: "DUP", details: { field: "email" } } });
  });

  it("maps ZodError to a 400 VALIDATION_ERROR with flattened details", () => {
    const parsed = z.object({ email: z.string().email() }).safeParse({ email: "nope" });
    const res = invoke((parsed as { error: unknown }).error);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.error).toMatchObject({ message: "Validation failed", code: "VALIDATION_ERROR" });
    expect(body.error.details.fieldErrors.email).toBeDefined();
  });

  it("hides internals for unknown errors and logs them", () => {
    const res = invoke(new Error("db password is hunter2"));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: { message: "Internal server error" } });
    expect(JSON.stringify(res.json.mock.calls)).not.toContain("hunter2");
    expect(loggerError).toHaveBeenCalledTimes(1);
  });
});
