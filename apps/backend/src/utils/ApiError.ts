export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, code?: string, details?: unknown) {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message, "UNAUTHORIZED");
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message, "FORBIDDEN");
  }

  static notFound(message = "Not found") {
    return new ApiError(404, message, "NOT_FOUND");
  }

  static conflict(message: string, code = "CONFLICT", details?: unknown) {
    return new ApiError(409, message, code, details);
  }

  static gone(message: string, code = "GONE") {
    return new ApiError(410, message, code);
  }
}
