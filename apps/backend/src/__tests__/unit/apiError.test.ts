import { ApiError } from "../../utils/ApiError";

describe("ApiError", () => {
  it("is an Error carrying status, code and details", () => {
    const err = new ApiError(418, "teapot", "TEAPOT", { a: 1 });
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("teapot");
    expect(err.status).toBe(418);
    expect(err.code).toBe("TEAPOT");
    expect(err.details).toEqual({ a: 1 });
  });

  it.each([
    ["badRequest", () => ApiError.badRequest("bad", "X", [1]), 400, "X", "bad"],
    ["unauthorized", () => ApiError.unauthorized(), 401, "UNAUTHORIZED", "Unauthorized"],
    ["unauthorized (custom)", () => ApiError.unauthorized("nope"), 401, "UNAUTHORIZED", "nope"],
    ["forbidden", () => ApiError.forbidden(), 403, "FORBIDDEN", "Forbidden"],
    ["notFound", () => ApiError.notFound(), 404, "NOT_FOUND", "Not found"],
    ["conflict", () => ApiError.conflict("dup"), 409, "CONFLICT", "dup"],
    ["conflict (custom code)", () => ApiError.conflict("dup", "DUPE"), 409, "DUPE", "dup"],
    ["gone", () => ApiError.gone("expired"), 410, "GONE", "expired"],
  ])("factory %s maps to the right status/code/message", (_name, make, status, code, message) => {
    const err = make();
    expect(err.status).toBe(status);
    expect(err.code).toBe(code);
    expect(err.message).toBe(message);
  });

  it("badRequest leaves code undefined when not provided", () => {
    expect(ApiError.badRequest("x").code).toBeUndefined();
  });
});
