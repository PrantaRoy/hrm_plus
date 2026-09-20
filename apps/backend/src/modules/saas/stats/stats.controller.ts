import { RequestHandler } from "express";
import { SaasStats } from "@hrm-plus/shared";
import { controlClient } from "../../../db/controlClient";

const MONTHS_BACK = 6;

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Last `MONTHS_BACK` calendar months (oldest first) plus the start of the oldest one. */
function monthWindow(now: Date): { keys: string[]; start: Date } {
  const keys: string[] = [];
  for (let i = MONTHS_BACK - 1; i >= 0; i--) {
    keys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return { keys, start: new Date(now.getFullYear(), now.getMonth() - (MONTHS_BACK - 1), 1) };
}

export const getStatsHandler: RequestHandler = async (_req, res, next) => {
  try {
    const { keys, start } = monthWindow(new Date());

    const [
      totalCompanies,
      totalPackages,
      activeCompanies,
      pendingApplications,
      openTickets,
      unreadContacts,
      tenantsByPackage,
      packages,
      recentApplicationsSubmitted,
      recentApplications,
      recentTickets,
    ] = await Promise.all([
      controlClient.tenant.count(),
      controlClient.package.count(),
      controlClient.tenant.count({ where: { status: "Active" } }),
      controlClient.tenantApplication.count({ where: { status: "Pending" } }),
      controlClient.supportTicket.count({ where: { status: { not: "Closed" } } }),
      controlClient.saasContactSubmission.count({ where: { status: "UNREAD" } }),
      controlClient.tenant.groupBy({ by: ["packageId"], _count: { _all: true } }),
      controlClient.package.findMany({ select: { id: true, name: true } }),
      controlClient.tenantApplication.findMany({
        where: { submittedAt: { gte: start } },
        select: { submittedAt: true },
      }),
      controlClient.tenantApplication.findMany({
        orderBy: { submittedAt: "desc" },
        take: 5,
        select: { id: true, companyName: true, companyType: true, status: true, submittedAt: true },
      }),
      controlClient.supportTicket.findMany({
        where: { status: { not: "Closed" } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          subject: true,
          status: true,
          priority: true,
          createdAt: true,
          tenant: { select: { name: true } },
        },
      }),
    ]);

    const packageNames = new Map(packages.map((p) => [p.id, p.name]));
    const companiesByPackage = tenantsByPackage
      .map((row) => ({
        packageName: row.packageId === null ? "No package" : (packageNames.get(row.packageId) ?? "Unknown"),
        count: row._count._all,
      }))
      .sort((a, b) => b.count - a.count);

    const monthCounts = new Map(keys.map((k) => [k, 0]));
    for (const app of recentApplicationsSubmitted) {
      const key = monthKey(app.submittedAt);
      monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
    }

    const stats: SaasStats = {
      totalCompanies,
      totalPackages,
      activeCompanies,
      pendingApplications,
      openTickets,
      unreadContacts,
      companiesByPackage,
      applicationsByMonth: keys.map((month) => ({ month, count: monthCounts.get(month) ?? 0 })),
      recentApplications: recentApplications.map((a) => ({
        id: a.id,
        companyName: a.companyName,
        companyType: a.companyType,
        status: a.status,
        submittedAt: a.submittedAt.toISOString(),
      })),
      recentTickets: recentTickets.map((t) => ({
        id: t.id,
        subject: t.subject,
        companyName: t.tenant.name,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt.toISOString(),
      })),
    };
    res.json(stats);
  } catch (err) {
    next(err);
  }
};
