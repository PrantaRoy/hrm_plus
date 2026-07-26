import { PrismaClient as TenantPrismaClient } from "../../generated/tenant";
import { RoleName } from "@hrm-plus/shared";

declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: number;
        slug: string;
        databaseName: string;
      };
      prisma?: TenantPrismaClient;
      user?: {
        id: number;
        email: string;
        role: RoleName;
      };
    }
  }
}

export {};
