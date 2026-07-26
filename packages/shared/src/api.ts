export interface ApiErrorBody {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export const TENANT_HEADER = "X-Tenant-Slug";
