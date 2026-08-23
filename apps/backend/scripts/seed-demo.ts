import "dotenv/config";
import bcrypt from "bcrypt";
import { EmploymentType } from "@hrm-plus/shared";
import { controlClient } from "../src/db/controlClient";
import { getTenantClient } from "../src/db/tenantClientPool";
import { tenantDatabaseUrl } from "../src/config/env";
import { redisConnection } from "../src/queue/redisConnection";
import { createPlaceholderImage } from "../src/utils/placeholderImage";
import {
  createTenantDatabase,
  runTenantMigrations,
  seedDefaultRoles,
  seedDefaultWeekDays,
  seedDefaultScreeningQuestions,
  seedDefaultSiteSections,
  seedDefaultLandingPageContent,
  provisionTenantAdmin,
} from "../src/modules/tenants/tenantProvisioning";
import { updateGeneralSettings } from "../src/modules/general-settings/generalSettings.service";
import {
  updateAttendanceSettings,
  setEmployeeMethods,
  setManualAttendance,
  markIncompleteAssignments,
} from "../src/modules/attendance/attendance.service";
import { createHoliday, publishHoliday } from "../src/modules/holidays/holiday.service";
import { createDepartment } from "../src/modules/departments/department.service";
import { createDesignation } from "../src/modules/designations/designation.service";
import { createShift } from "../src/modules/shifts/shift.service";
import { createDutySchedule } from "../src/modules/duty-schedules/dutySchedule.service";
import { createEmployee, updateEmployee } from "../src/modules/employees/employee.service";
import { createEmployeeDocument } from "../src/modules/employees/employeeDocument.service";
import { createRoster, autoGenerateRoster, approveRoster } from "../src/modules/rosters/roster.service";
import { createLeaveType } from "../src/modules/leave-types/leaveType.service";
import { createAllocation } from "../src/modules/leave-allocations/leaveAllocation.service";
import {
  createLeaveRequest,
  decideLeaveRequest,
  cancelLeaveRequest,
} from "../src/modules/leave-requests/leaveRequest.service";
import { createDocumentTemplate } from "../src/modules/document-templates/documentTemplate.service";
import { createDocumentRequest, decideDocumentRequest } from "../src/modules/document-requests/documentRequest.service";
import { TenantContext } from "../src/modules/document-requests/documentRequest.render";
import { createAsset, assignAsset, returnAsset, retireAsset } from "../src/modules/assets/asset.service";
import { createJob, publishJob, closeJob } from "../src/modules/jobs/job.service";
import { getApplicationById } from "../src/modules/applications/application.service";
import { upsertAssessment, publishAssessment, submitAssessmentAnswers } from "../src/modules/assessments/assessment.service";
import { moveApplicationStage } from "../src/modules/pipeline/pipeline.service";
import { createPayCycle, assignEmployeesToPayCycle } from "../src/modules/payroll/payCycle.service";
import { createPayRate } from "../src/modules/payroll/payRate.service";
import { generateWorkReportsForPeriod, approveWorkReport } from "../src/modules/payroll/workReport.service";
import { generateDraftPayrollRun, submitPayrollForPayment } from "../src/modules/payroll/payrollRun.service";

/**
 * Idempotent demo-data seeder. Safe to re-run at any time (e.g. after a fresh
 * `prisma migrate deploy` or a wiped local database) — it always resets the
 * demo credentials back to fixed, known values instead of leaving behind a
 * previously auto-generated password.
 */

// BullMQ (payroll PDF / IRD filing / assessment grading queues) needs Redis, which
// isn't part of the documented local-dev setup (README only asks for MySQL). This
// seeder deliberately never enqueues a job (see seedPayroll's comment below), but the
// service modules it imports still instantiate this shared ioredis connection at
// import time and retry forever in the background when Redis isn't running — silence
// its console spam rather than leaving an unhandled 'error' listener warning per retry.
redisConnection.on("error", () => undefined);

const SAAS_ADMIN = {
  email: process.env.SEED_SAAS_ADMIN_EMAIL ?? "saas@hrmplus.test",
  password: process.env.SEED_SAAS_ADMIN_PASSWORD ?? "1234abcd",
};

const DEMO_TENANT = {
  name: "Acme Ltd",
  slug: "acme",
  adminEmail: process.env.SEED_TENANT_ADMIN_EMAIL ?? "acme@hrmplus.test",
  adminPassword: process.env.SEED_TENANT_ADMIN_PASSWORD ?? "1234abcd",
};

const DEMO_EMPLOYEE_PASSWORD = "12345678";

async function seedSaasAdmin(): Promise<void> {
  const passwordHash = await bcrypt.hash(SAAS_ADMIN.password, 10);
  await controlClient.platformAdmin.upsert({
    where: { email: SAAS_ADMIN.email },
    update: { passwordHash },
    create: { email: SAAS_ADMIN.email, passwordHash },
  });
  console.log(`SaaS super-admin ready: ${SAAS_ADMIN.email} / ${SAAS_ADMIN.password}`);
}

async function seedDemoTenant(): Promise<void> {
  let tenant = await controlClient.tenant.findUnique({ where: { slug: DEMO_TENANT.slug } });

  if (!tenant) {
    const databaseName = `hrm_tenant_${DEMO_TENANT.slug.replace(/-/g, "_")}`;
    console.log(`Creating database ${databaseName}...`);
    await createTenantDatabase(databaseName);
    tenant = await controlClient.tenant.create({
      data: { name: DEMO_TENANT.name, slug: DEMO_TENANT.slug, databaseName, status: "Active" },
    });
  }

  console.log(`Running migrations for tenant "${DEMO_TENANT.slug}"...`);
  runTenantMigrations(tenantDatabaseUrl(tenant.databaseName));

  const tenantClient = getTenantClient(tenant.databaseName);
  const roleIds = await seedDefaultRoles(tenantClient);
  await seedDefaultWeekDays(tenantClient);
  await seedDefaultScreeningQuestions(tenantClient);
  await seedDefaultSiteSections(tenantClient);

  const admin = await provisionTenantAdmin(tenantClient, {
    email: DEMO_TENANT.adminEmail,
    password: DEMO_TENANT.adminPassword,
    roleId: roleIds.Admin,
  });

  await seedDefaultLandingPageContent(tenantClient, { id: admin.id, email: admin.email }, DEMO_TENANT.name);
  await seedFullDemoData(tenantClient, { id: tenant.id, slug: tenant.slug }, admin, roleIds);

  console.log(
    `Tenant admin ready: [slug=${DEMO_TENANT.slug}] ${DEMO_TENANT.adminEmail} / ${DEMO_TENANT.adminPassword}`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────────────────────────────────────

function utcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function addDays(d: Date, days: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days));
}
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
// Shifts an "HH:MM" duty-schedule time by `deltaMinutes` (used to fabricate realistic
// check-in/check-out variance around a scheduled start/end time).
function shiftTime(base: string, deltaMinutes: number): string {
  const [h, m] = base.split(":").map(Number);
  const total = (((h * 60 + m + deltaMinutes) % 1440) + 1440) % 1440;
  const hh = Math.floor(total / 60).toString().padStart(2, "0");
  const mm = (total % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Document template bodies (kept short — see documentRequest.render.ts for the
// {{token}} / {{signature:Role}} substitution rules)
// ─────────────────────────────────────────────────────────────────────────────

const SALARY_CERT_HTML = `<div style="font-family:Arial,sans-serif;padding:40px;line-height:1.6;">
<h2>Salary Certificate</h2>
<p>This is to certify that <strong>{{employee.fullName}}</strong> (Employee Code: {{employee.employeeCode}}) is
employed at {{company.name}} as <strong>{{employee.jobTitle}}</strong> in the {{employee.department}} department,
since {{employee.joiningDate}}.</p>
<p>Reason for request: {{request.reason}}</p>
<p>Reference Number: {{referenceNumber}}<br/>Issued on {{currentDate}}.</p>
<div style="margin-top:60px;display:flex;gap:80px;">
<div>{{signature:ReportingManager}}<p>Reporting Manager</p></div>
<div>{{signature:HR}}<p>Human Resources</p></div>
</div></div>`;

const EXP_LETTER_HTML = `<div style="font-family:Arial,sans-serif;padding:40px;line-height:1.6;">
<h2>Experience Letter</h2>
<p>This is to certify that <strong>{{employee.fullName}}</strong> has been a valued member of {{company.name}}
as <strong>{{employee.jobTitle}}</strong> since {{employee.joiningDate}}.</p>
<p>Reference Number: {{referenceNumber}}<br/>Issued on {{currentDate}}.</p>
<div style="margin-top:60px;">{{signature:HR}}<p>Human Resources</p></div>
</div>`;

const APPOINTMENT_HTML = `<div style="font-family:Arial,sans-serif;padding:40px;line-height:1.6;">
<h2>Appointment Letter</h2>
<p>Dear {{employee.fullName}},</p>
<p>We are pleased to confirm your appointment as <strong>{{employee.jobTitle}}</strong> at {{company.name}},
effective {{employee.joiningDate}}.</p>
<p>Reference Number: {{referenceNumber}}<br/>Issued on {{currentDate}}.</p>
<div style="margin-top:60px;">{{signature:Admin}}<p>Managing Director</p></div>
</div>`;

const ASSET_RECEIPT_HTML = `<div style="font-family:Arial,sans-serif;padding:40px;line-height:1.6;">
<h2>Asset Receipt Acknowledgement</h2>
<p>I, <strong>{{employee.fullName}}</strong>, acknowledge receipt of the following company asset:</p>
<p>Asset: {{fieldValues.assetName}} ({{fieldValues.assetTag}})<br/>Assigned Date: {{fieldValues.assignedDate}}</p>
<p>Reference Number: {{referenceNumber}}</p>
<div style="margin-top:60px;">{{signature:Self}}<p>Employee Signature</p></div>
</div>`;

const ASSET_RETURN_HTML = `<div style="font-family:Arial,sans-serif;padding:40px;line-height:1.6;">
<h2>Asset Return Checklist</h2>
<p>Employee: {{employee.fullName}}</p>
<p>The company assets listed against this request are pending / confirmed returned.</p>
<p>Reference Number: {{referenceNumber}}</p>
<div style="margin-top:60px;">{{signature:HR}}<p>Human Resources</p></div>
</div>`;

// ─────────────────────────────────────────────────────────────────────────────
// Full demo dataset — one comprehensive pass touching every module so the "Acme
// Ltd" tenant has enough realistic, interlinked data to demo the whole product:
// org structure, rosters/attendance, leave, holidays, documents, assets,
// recruitment/ATS, and a full payroll cycle. Guarded by a single existence check
// (rather than per-entity idempotency, which most of these services don't
// support anyway via unique names) since this only ever targets the fixed demo
// tenant seeded by this script.
// ─────────────────────────────────────────────────────────────────────────────

interface SeededEmployee {
  key: string;
  employeeId: number;
  userId: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

type Registry = Record<string, SeededEmployee>;

export async function seedFullDemoData(
  tc: ReturnType<typeof getTenantClient>,
  tenant: { id: number; slug: string },
  admin: { id: number; email: string },
  roleIds: Record<string, number>
): Promise<void> {
  if (await tc.department.findFirst({ where: { name: "Engineering" } })) {
    console.log("Full demo dataset already present — skipping.");
    return;
  }

  const TODAY = utcMidnight(new Date());
  const YEAR = TODAY.getUTCFullYear();
  const tenantCtx: TenantContext = { id: tenant.id, slug: tenant.slug };

  console.log("Seeding full demo dataset (org structure, rosters, leave, documents, assets, ATS, payroll)...");

  // ── General & attendance settings ─────────────────────────────────────────
  await updateGeneralSettings(
    tc,
    { siteTitle: DEMO_TENANT.name, timezone: "Pacific/Auckland", currency: "NZD", dateFormat: "DD/MM/YYYY", timeFormat: "24h" },
    admin.id
  );
  await updateAttendanceSettings(tc, { pressAndHoldEnabled: true }, admin.id);

  // ── Org structure: departments, designations, shifts, duty schedules ──────
  const DEPARTMENT_NAMES = ["Executive", "Engineering", "Sales & Marketing", "Human Resources", "Operations", "Finance"];
  const deptByName: Record<string, number> = {};
  for (const name of DEPARTMENT_NAMES) {
    deptByName[name] = (await createDepartment(tc, { name })).id;
  }

  const DESIGNATION_NAMES = [
    "Managing Director",
    "Engineering Manager",
    "Senior Software Engineer",
    "Software Engineer",
    "Sales Manager",
    "Sales Executive",
    "HR Manager",
    "HR Officer",
    "Operations Coordinator",
    "Finance Manager",
    "Payroll Officer",
  ];
  const desigByName: Record<string, number> = {};
  for (const name of DESIGNATION_NAMES) {
    desigByName[name] = (await createDesignation(tc, { name })).id;
  }

  await createShift(tc, { name: "Day Shift", startTime: "09:00", endTime: "17:00" });
  await createShift(tc, { name: "Evening Shift", startTime: "13:00", endTime: "21:00" });

  await createDutySchedule(tc, {
    name: "Standard Day",
    startTime: "09:00",
    endTime: "17:00",
    checkinConsiderMinutes: 15,
    checkoutConsiderMinutes: 15,
    maxOverTimeMinutes: 120,
    earlyCheckinBufferMinutes: 30,
  });
  await createDutySchedule(tc, {
    name: "Early Shift",
    startTime: "07:00",
    endTime: "15:00",
    checkinConsiderMinutes: 15,
    checkoutConsiderMinutes: 15,
    maxOverTimeMinutes: 120,
    earlyCheckinBufferMinutes: 30,
  });

  // ── Employees ───────────────────────────────────────────────────────────
  const adminEmployee = await tc.employee.findUniqueOrThrow({ where: { userId: admin.id } });
  await updateEmployee(tc, adminEmployee.id, {
    firstName: "Ava",
    lastName: "Thompson",
    jobTitle: "Managing Director",
    departmentId: deptByName["Executive"],
    designationId: desigByName["Managing Director"],
    employmentType: "Full-Time",
  });
  // joiningDate isn't editable via updateEmployee by design (see employee.service.ts) —
  // a direct write here just backdates the seeded admin so they don't read as having
  // joined "today", which would look odd for a Managing Director in a live demo.
  await tc.employee.update({ where: { id: adminEmployee.id }, data: { joiningDate: new Date(Date.UTC(YEAR - 4, 0, 10)) } });

  const registry: Registry = {
    admin: {
      key: "admin",
      employeeId: adminEmployee.id,
      userId: admin.id,
      email: admin.email,
      role: "Admin",
      firstName: "Ava",
      lastName: "Thompson",
    },
  };

  async function hire(
    key: string,
    params: {
      firstName: string;
      lastName: string;
      email: string;
      role: string;
      department: string;
      designation: string;
      reportingTo: string;
      joiningDate: string;
      gender: "Male" | "Female" | "Other";
      employmentType?: EmploymentType;
    }
  ): Promise<SeededEmployee> {
    const dto = await createEmployee(tc, {
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      role: params.role,
      joiningDate: params.joiningDate,
      gender: params.gender,
      employmentType: params.employmentType,
      departmentId: deptByName[params.department],
      designationId: desigByName[params.designation],
      reportingToId: registry[params.reportingTo].employeeId,
      password: DEMO_EMPLOYEE_PASSWORD,
    });
    const user = await tc.user.findUniqueOrThrow({ where: { email: params.email } });
    const seeded: SeededEmployee = {
      key,
      employeeId: dto.id,
      userId: user.id,
      email: params.email,
      role: params.role,
      firstName: dto.firstName,
      lastName: dto.lastName,
    };
    registry[key] = seeded;
    return seeded;
  }

  function actingUser(key: string): { id: number; role: string } {
    const e = registry[key];
    return { id: e.userId, role: e.role };
  }

  await hire("priya", {
    firstName: "Priya",
    lastName: "Sharma",
    email: "priya.sharma@acme.hrmplus.test",
    role: "HR",
    department: "Human Resources",
    designation: "HR Manager",
    reportingTo: "admin",
    joiningDate: "2022-03-15",
    gender: "Female",
  });
  await hire("james", {
    firstName: "James",
    lastName: "Carter",
    email: "james.carter@acme.hrmplus.test",
    role: "Manager",
    department: "Engineering",
    designation: "Engineering Manager",
    reportingTo: "admin",
    joiningDate: "2022-05-01",
    gender: "Male",
  });
  await hire("aroha", {
    firstName: "Aroha",
    lastName: "Ngata",
    email: "aroha.ngata@acme.hrmplus.test",
    role: "Manager",
    department: "Sales & Marketing",
    designation: "Sales Manager",
    reportingTo: "admin",
    joiningDate: "2022-07-20",
    gender: "Female",
  });
  await hire("meera", {
    firstName: "Meera",
    lastName: "Patel",
    email: "meera.patel@acme.hrmplus.test",
    role: "Payroll",
    department: "Finance",
    designation: "Payroll Officer",
    reportingTo: "admin",
    joiningDate: "2023-01-10",
    gender: "Female",
  });
  await hire("david", {
    firstName: "David",
    lastName: "Chen",
    email: "david.chen@acme.hrmplus.test",
    role: "Finance",
    department: "Finance",
    designation: "Finance Manager",
    reportingTo: "admin",
    joiningDate: "2022-09-05",
    gender: "Male",
  });
  await hire("liam", {
    firstName: "Liam",
    lastName: "O'Connor",
    email: "liam.oconnor@acme.hrmplus.test",
    role: "Staff",
    department: "Engineering",
    designation: "Senior Software Engineer",
    reportingTo: "james",
    joiningDate: "2023-02-01",
    gender: "Male",
  });
  await hire("sophie", {
    firstName: "Sophie",
    lastName: "Williams",
    email: "sophie.williams@acme.hrmplus.test",
    role: "Staff",
    department: "Engineering",
    designation: "Software Engineer",
    reportingTo: "james",
    joiningDate: "2024-04-15",
    gender: "Female",
  });
  await hire("noah", {
    firstName: "Noah",
    lastName: "Kim",
    email: "noah.kim@acme.hrmplus.test",
    role: "Staff",
    department: "Engineering",
    designation: "Software Engineer",
    reportingTo: "james",
    joiningDate: "2025-01-20",
    gender: "Male",
  });
  await hire("grace", {
    firstName: "Grace",
    lastName: "Taylor",
    email: "grace.taylor@acme.hrmplus.test",
    role: "Staff",
    department: "Sales & Marketing",
    designation: "Sales Executive",
    reportingTo: "aroha",
    joiningDate: "2023-11-01",
    gender: "Female",
  });
  await hire("ethan", {
    firstName: "Ethan",
    lastName: "Brown",
    email: "ethan.brown@acme.hrmplus.test",
    role: "Staff",
    department: "Sales & Marketing",
    designation: "Sales Executive",
    reportingTo: "aroha",
    joiningDate: "2024-06-10",
    gender: "Male",
    employmentType: "Contract",
  });
  await hire("isabella", {
    firstName: "Isabella",
    lastName: "Wilson",
    email: "isabella.wilson@acme.hrmplus.test",
    role: "Staff",
    department: "Operations",
    designation: "Operations Coordinator",
    reportingTo: "admin",
    joiningDate: "2023-08-01",
    gender: "Female",
  });
  await hire("mason", {
    firstName: "Mason",
    lastName: "Lee",
    email: "mason.lee@acme.hrmplus.test",
    role: "Staff",
    department: "Human Resources",
    designation: "HR Officer",
    reportingTo: "priya",
    joiningDate: "2024-09-15",
    gender: "Male",
    employmentType: "Part-Time",
  });

  // PressAndHold is the only attendance method this build supports — enabling it per
  // employee is what makes today's live check-in/check-out work in the running demo.
  for (const emp of Object.values(registry)) {
    await setEmployeeMethods(tc, emp.employeeId, { methods: ["PressAndHold"] });
  }

  // ── Holidays (published, so rosters/payroll factor them in) ──────────────
  async function seedHoliday(name: string, date: Date, publish: boolean) {
    const holiday = await createHoliday(tc, { name, date: ymd(date) }, admin.id);
    if (publish) await publishHoliday(tc, holiday.id, admin.id);
  }
  await seedHoliday("New Year's Day", new Date(Date.UTC(YEAR, 0, 1)), true);
  await seedHoliday("Waitangi Day", new Date(Date.UTC(YEAR, 1, 6)), true);
  await seedHoliday("Company Foundation Day", addDays(TODAY, -4), true);
  await seedHoliday("Christmas Day", new Date(Date.UTC(YEAR, 11, 25)), true);
  await seedHoliday("Boxing Day", new Date(Date.UTC(YEAR, 11, 26)), false); // left as Draft on purpose

  // ── Rosters + attendance: a 20-day window (13 days back, today, 6 days
  // ahead) per department, auto-generated then approved. Past working days get
  // realistic manual check-in/out times (a few left absent → flipped to
  // "Incomplete"); today and future days stay "Scheduled" so check-in/out can
  // be demoed live in the running app.
  const deptGroups: { department: string; employees: SeededEmployee[] }[] = [
    { department: "Executive", employees: [registry.admin] },
    { department: "Engineering", employees: [registry.james, registry.liam, registry.sophie, registry.noah] },
    { department: "Sales & Marketing", employees: [registry.aroha, registry.grace, registry.ethan] },
    { department: "Human Resources", employees: [registry.priya, registry.mason] },
    { department: "Operations", employees: [registry.isabella] },
    { department: "Finance", employees: [registry.meera, registry.david] },
  ];

  const rosterStart = addDays(TODAY, -13);
  const rosterEnd = addDays(TODAY, 6);

  for (const group of deptGroups) {
    const roster = await createRoster(
      tc,
      { departmentId: deptByName[group.department], periodType: "Fortnightly", startDate: ymd(rosterStart), endDate: ymd(rosterEnd) },
      admin.id
    );
    await autoGenerateRoster(tc, roster.id, false, admin.id);
    await approveRoster(tc, roster.id, admin.id);

    const pastAssignments = await tc.dutyScheduleAssignment.findMany({
      where: { rosterId: roster.id, date: { lt: TODAY }, dutyScheduleId: { not: null } },
      include: { dutySchedule: true },
    });

    for (const a of pastAssignments) {
      if (!a.dutySchedule) continue;
      if (Math.random() < 0.18) continue; // simulate an occasional absence, left "Scheduled" for now
      const checkInDelta = randomInt(-5, 22);
      const checkOutDelta = randomInt(-10, 20);
      const late = checkInDelta > a.dutySchedule.checkinConsiderMinutes;
      await setManualAttendance(
        tc,
        a.employeeId,
        {
          date: ymd(a.date),
          checkInTime: shiftTime(a.dutySchedule.startTime, checkInDelta),
          checkOutTime: shiftTime(a.dutySchedule.endTime, checkOutDelta),
          note: late ? "Traffic delay" : undefined,
        },
        registry.priya.userId
      );
    }
  }

  // Sweeps every past "Scheduled" assignment with no attendance row to "Incomplete" —
  // demonstrates the same lazy sweep the app performs on every attendance read.
  await markIncompleteAssignments(tc, { lookbackDays: 20 });

  // ── Leave: types, per-employee allocations, and a spread of request states ─
  const annualLeave = await createLeaveType(tc, { name: "Annual Leave", assignedDays: 20 });
  const sickLeave = await createLeaveType(tc, { name: "Sick Leave", assignedDays: 10 });
  const personalLeave = await createLeaveType(tc, { name: "Personal Leave", assignedDays: 5 });

  const twoStepChain = [{ approverType: "ReportingManager" as const }, { approverType: "Role" as const, roleId: roleIds.HR }];
  const hrOnlyChain = [{ approverType: "Role" as const, roleId: roleIds.HR }];

  for (const [key, emp] of Object.entries(registry)) {
    // The admin has no reportingToId, so a ReportingManager step would block them from
    // ever requesting their own leave — give the admin an HR-only chain instead.
    const chain = key === "admin" ? hrOnlyChain : twoStepChain;
    for (const leaveType of [annualLeave, sickLeave, personalLeave]) {
      await createAllocation(
        tc,
        emp.employeeId,
        { leaveTypeId: leaveType.id, year: YEAR, allocatedDays: leaveType.assignedDays, approvalSteps: chain },
        admin.id
      );
    }
  }

  async function requestLeave(empKey: string, leaveType: { id: number }, startOffset: number, endOffset: number, reason: string) {
    const emp = registry[empKey];
    return createLeaveRequest(
      tc,
      emp.employeeId,
      { leaveTypeId: leaveType.id, startDate: ymd(addDays(TODAY, startOffset)), endDate: ymd(addDays(TODAY, endOffset)), reason },
      emp.userId
    );
  }

  await requestLeave("liam", annualLeave, 12, 14, "Family trip"); // left Pending — James's approval queue

  const sophieReq = await requestLeave("sophie", sickLeave, -18, -17, "Flu");
  await decideLeaveRequest(tc, sophieReq.id, "Approve", actingUser("james"), "Get well soon");
  await decideLeaveRequest(tc, sophieReq.id, "Approve", actingUser("priya"), "Approved");

  const graceReq = await requestLeave("grace", annualLeave, 20, 22, "Wedding");
  await decideLeaveRequest(tc, graceReq.id, "Approve", actingUser("aroha"), "Enjoy!");
  await decideLeaveRequest(tc, graceReq.id, "Approve", actingUser("priya"), "Approved");

  await requestLeave("ethan", personalLeave, 7, 7, "Personal matter"); // left Pending — Aroha's approval queue

  const isabellaReq = await requestLeave("isabella", sickLeave, -16, -16, "Medical appointment");
  await decideLeaveRequest(tc, isabellaReq.id, "Approve", actingUser("admin"), "Approved");
  await decideLeaveRequest(tc, isabellaReq.id, "Approve", actingUser("priya"), "Approved");

  const masonReq = await requestLeave("mason", annualLeave, 14, 17, "Long weekend");
  await decideLeaveRequest(tc, masonReq.id, "Reject", actingUser("priya"), "Team short-staffed that week");

  const noahReq = await requestLeave("noah", personalLeave, 25, 25, "Moving house");
  await cancelLeaveRequest(tc, noahReq.id, actingUser("noah"));

  const priyaReq = await requestLeave("priya", annualLeave, 40, 44, "Overseas holiday");
  await decideLeaveRequest(tc, priyaReq.id, "Approve", actingUser("admin"), "Approved");
  await decideLeaveRequest(tc, priyaReq.id, "Approve", actingUser("admin"), "Approved");

  const jamesReq = await requestLeave("james", sickLeave, -30, -29, "Migraine");
  await decideLeaveRequest(tc, jamesReq.id, "Approve", actingUser("admin"), "Approved");
  await decideLeaveRequest(tc, jamesReq.id, "Approve", actingUser("admin"), "Approved");

  // ── Document templates + a spread of requests through the approval chain ──
  async function categoryId(code: string): Promise<number> {
    return (await tc.documentCategory.findUniqueOrThrow({ where: { code } })).id;
  }

  const salaryCertTemplate = await createDocumentTemplate(
    tc,
    {
      shortCode: "SALARY_CERT_STD",
      name: "Standard Salary Certificate",
      categoryId: await categoryId("SALARY_CERT"),
      bodyHtml: SALARY_CERT_HTML,
      isStaffRequestable: true,
      approvalSteps: [{ approverType: "ReportingManager" }, { approverType: "Role", roleId: roleIds.HR }],
    },
    admin.id
  );
  const expLetterTemplate = await createDocumentTemplate(
    tc,
    {
      shortCode: "EXP_LETTER_STD",
      name: "Experience Letter",
      categoryId: await categoryId("EXP_LETTER"),
      bodyHtml: EXP_LETTER_HTML,
      isStaffRequestable: true,
      approvalSteps: [{ approverType: "Role", roleId: roleIds.HR }],
    },
    admin.id
  );
  const appointmentTemplate = await createDocumentTemplate(
    tc,
    {
      shortCode: "APPOINT_LETTER_STD",
      name: "Appointment Letter",
      categoryId: await categoryId("APPOINT_LETTER"),
      bodyHtml: APPOINTMENT_HTML,
      isStaffRequestable: false,
      approvalSteps: [{ approverType: "Role", roleId: roleIds.Admin }],
    },
    admin.id
  );
  // shortCode must match ASSET_RECEIPT_ACK / ASSET_RETURN_CHECKLIST exactly — these are
  // the fixed codes asset.service.ts looks up to auto-create sign-off requests when
  // assets are assigned/offboarded. isStaffRequestable is left true so that flow works
  // regardless of which role performs the assignment (see asset.service.ts's
  // tryCreateAssetReceiptRequest — a non-privileged actingUser would otherwise hit the
  // "not self-requestable" guard and the whole receipt request would be silently skipped).
  await createDocumentTemplate(
    tc,
    {
      shortCode: "ASSET_RECEIPT_ACK",
      name: "Asset Receipt Acknowledgement",
      categoryId: await categoryId("ASSET_RECEIPT"),
      bodyHtml: ASSET_RECEIPT_HTML,
      isStaffRequestable: true,
      approvalSteps: [{ approverType: "Self" }],
    },
    admin.id
  );
  await createDocumentTemplate(
    tc,
    {
      shortCode: "ASSET_RETURN_CHECKLIST",
      name: "Asset Return Checklist",
      categoryId: await categoryId("ASSET_RETURN"),
      bodyHtml: ASSET_RETURN_HTML,
      isStaffRequestable: true,
      approvalSteps: [{ approverType: "Role", roleId: roleIds.HR }],
    },
    admin.id
  );

  await createDocumentRequest(
    tc,
    registry.liam.employeeId,
    { templateId: salaryCertTemplate.id, reason: "Mortgage pre-approval" },
    registry.liam.userId,
    actingUser("liam")
  ); // left Pending — James's approval queue

  const sophieDocReq = await createDocumentRequest(
    tc,
    registry.sophie.employeeId,
    { templateId: expLetterTemplate.id, reason: "Visa application" },
    registry.sophie.userId,
    actingUser("sophie")
  );
  await decideDocumentRequest(tc, tenantCtx, sophieDocReq.id, "Approve", actingUser("priya"), "Approved");

  const graceDocReq = await createDocumentRequest(
    tc,
    registry.grace.employeeId,
    { templateId: salaryCertTemplate.id, reason: "Rental application" },
    registry.grace.userId,
    actingUser("grace")
  );
  await decideDocumentRequest(tc, tenantCtx, graceDocReq.id, "Approve", actingUser("aroha"), "Approved");
  await decideDocumentRequest(tc, tenantCtx, graceDocReq.id, "Approve", actingUser("priya"), "Approved");

  await createDocumentRequest(
    tc,
    registry.mason.employeeId,
    { templateId: salaryCertTemplate.id, reason: "Bank loan" },
    registry.mason.userId,
    actingUser("mason")
  ); // left Pending — Priya's approval queue

  const ethanAppointment = await createDocumentRequest(
    tc,
    registry.ethan.employeeId,
    { templateId: appointmentTemplate.id },
    admin.id,
    actingUser("admin")
  );
  await decideDocumentRequest(tc, tenantCtx, ethanAppointment.id, "Approve", actingUser("admin"), "Welcome aboard");

  // ── Employee personal documents (visa/certification attachments) ─────────
  const placeholderDoc = createPlaceholderImage(600, 400, "#4F46E5");
  await createEmployeeDocument(
    tc,
    registry.meera.employeeId,
    { documentName: "Work Visa", type: "Visa", startDate: "2023-01-10", expiryDate: ymd(addDays(TODAY, 25)) },
    { buffer: placeholderDoc, originalName: "work-visa.png", mimeType: "image/png" }
  );
  await createEmployeeDocument(
    tc,
    registry.isabella.employeeId,
    { documentName: "First Aid Certificate", type: "Certification", startDate: "2025-01-01", expiryDate: ymd(new Date(Date.UTC(YEAR + 1, 0, 1))) },
    { buffer: placeholderDoc, originalName: "first-aid-cert.png", mimeType: "image/png" }
  );

  // ── Assets: laptops/mobile/vehicle assigned, one returned, one retired ────
  const laptop1 = await createAsset(
    tc,
    { name: 'MacBook Pro 14"', category: "Laptop", serialNumber: "MBP14-2026-001", purchaseDate: "2025-01-15", purchaseCost: 3200, supplier: "PB Tech" },
    admin.id
  );
  await assignAsset(tc, laptop1.id, { employeeId: registry.liam.employeeId, conditionOnAssign: "New" }, actingUser("admin"));

  const laptop2 = await createAsset(
    tc,
    { name: "Dell Latitude 5420", category: "Laptop", serialNumber: "DL5420-2026-014", purchaseDate: "2025-06-10", purchaseCost: 2100, supplier: "PB Tech" },
    admin.id
  );
  await assignAsset(tc, laptop2.id, { employeeId: registry.sophie.employeeId, conditionOnAssign: "New" }, actingUser("james"));

  const phone = await createAsset(
    tc,
    { name: "iPhone 14", category: "Mobile", serialNumber: "IP14-2026-077", purchaseDate: "2025-02-01", purchaseCost: 1400, supplier: "Apple" },
    admin.id
  );
  await assignAsset(tc, phone.id, { employeeId: registry.grace.employeeId, conditionOnAssign: "New" }, actingUser("aroha"));

  const vehicle = await createAsset(
    tc,
    {
      name: "Toyota Hilux SR5",
      category: "VehicleCar",
      registrationNumber: "ACM123",
      make: "Toyota",
      model: "Hilux SR5",
      registrationExpiry: ymd(addDays(TODAY, 18)),
      wofCofExpiry: ymd(addDays(TODAY, 6)),
      isFbtRelevant: true,
      fbtNotes: "Used for client site visits — approx. 60% business use",
      purchaseDate: "2024-03-01",
      purchaseCost: 52000,
      supplier: "Toyota NZ",
    },
    admin.id
  );
  await assignAsset(tc, vehicle.id, { employeeId: registry.ethan.employeeId, conditionOnAssign: "Excellent" }, actingUser("aroha"));

  await createAsset(
    tc,
    { name: "HP LaserJet Pro M404", category: "OfficeEquipment", serialNumber: "HP-M404-009", purchaseDate: "2023-06-01", purchaseCost: 450, supplier: "Officeworks" },
    admin.id
  ); // left unassigned / Available

  const drill = await createAsset(
    tc,
    { name: "Makita Impact Drill", category: "Tool", serialNumber: "MK-DRL-7781", testAndTagExpiry: ymd(addDays(TODAY, 22)), purchaseDate: "2024-11-01", purchaseCost: 220, supplier: "Bunnings" },
    admin.id
  );
  await assignAsset(tc, drill.id, { employeeId: registry.isabella.employeeId, conditionOnAssign: "Good" }, actingUser("admin"));
  await returnAsset(tc, drill.id, { conditionOnReturn: "Good — minor wear" }, actingUser("admin"));

  const oldIpad = await createAsset(
    tc,
    { name: "iPad Air (3rd Gen)", category: "Other", serialNumber: "IPAD-OLD-002", purchaseDate: "2019-05-01", purchaseCost: 800, supplier: "Apple" },
    admin.id
  );
  await retireAsset(tc, oldIpad.id, admin.id);

  // ── Recruitment / ATS: jobs, an assessment per open role, and applications
  // spread across the pipeline (fresh applicant, mid-assessment, hired, and
  // rejected) ────────────────────────────────────────────────────────────
  const rightToWorkQ = await tc.screeningQuestion.findUniqueOrThrow({ where: { code: "NZ_RIGHT_TO_WORK" } });
  const ageConfirmQ = await tc.screeningQuestion.findUniqueOrThrow({ where: { code: "GENERIC_AGE_CONFIRMATION" } });

  const engJob = await createJob(
    tc,
    {
      title: "Senior Software Engineer",
      vacancyCount: 2,
      location: "Auckland, NZ",
      skills: ["Node.js", "React", "TypeScript", "AWS"],
      minExperienceYears: 3,
      maxExperienceYears: 8,
      jobType: "FULL_TIME",
      salaryType: "ANNUAL",
      salaryMin: 95000,
      salaryMax: 125000,
      description: "<p>We're looking for a Senior Software Engineer to join our growing Engineering team, working across our tenant API and React apps.</p>",
      departmentId: deptByName["Engineering"],
      screeningQuestions: [
        { questionId: rightToWorkQ.id, isMandatory: true, sortOrder: 0 },
        { questionId: ageConfirmQ.id, isMandatory: true, sortOrder: 1 },
      ],
    },
    registry.james.userId
  );
  await publishJob(tc, engJob.id, registry.james.userId);

  const engAssessment = await upsertAssessment(
    tc,
    engJob.id,
    {
      title: "Senior Software Engineer — Technical Screen",
      instructions: "Answer all questions to the best of your ability. This should take about 10 minutes.",
      passThresholdPercent: 60,
      questions: [
        { type: "MCQ", prompt: "Which HTTP method is idempotent?", options: ["POST", "GET", "PATCH", "CONNECT"], correctOptionIndex: 1, points: 10, sortOrder: 0 },
        { type: "MCQ", prompt: "In React, which hook memoizes a computed value?", options: ["useEffect", "useMemo", "useRef", "useState"], correctOptionIndex: 1, points: 10, sortOrder: 1 },
        { type: "TRUE_FALSE", prompt: "TypeScript's `any` type disables type checking for that value.", correctOptionIndex: 0, points: 10, sortOrder: 2 },
        { type: "MCQ", prompt: "Which of these is NOT a Node.js built-in module?", options: ["fs", "path", "lodash", "http"], correctOptionIndex: 2, points: 10, sortOrder: 3 },
        { type: "TRUE_FALSE", prompt: "A database index can speed up read queries at the cost of slower writes.", correctOptionIndex: 0, points: 10, sortOrder: 4 },
      ],
    },
    registry.james.userId
  );
  await publishAssessment(tc, engJob.id, registry.james.userId);

  const salesJob = await createJob(
    tc,
    {
      title: "Sales Executive",
      vacancyCount: 1,
      location: "Auckland, NZ",
      skills: ["CRM", "Negotiation", "Cold Calling"],
      minExperienceYears: 1,
      jobType: "FULL_TIME",
      salaryType: "ANNUAL",
      salaryMin: 55000,
      salaryMax: 70000,
      description: "<p>Join our Sales team growing Acme's presence across the North Island.</p>",
      departmentId: deptByName["Sales & Marketing"],
      screeningQuestions: [{ questionId: ageConfirmQ.id, isMandatory: true, sortOrder: 0 }],
    },
    registry.aroha.userId
  );
  await publishJob(tc, salesJob.id, registry.aroha.userId);

  const salesAssessment = await upsertAssessment(
    tc,
    salesJob.id,
    {
      title: "Sales Executive — Screening Quiz",
      passThresholdPercent: 60,
      questions: [
        {
          type: "MCQ",
          prompt: 'A prospect says "it\'s too expensive." What is the best first response?',
          options: ["Offer an immediate discount", "Ask what budget they had in mind and clarify the value", "End the call", "Repeat the pitch"],
          correctOptionIndex: 1,
          points: 10,
          sortOrder: 0,
        },
        { type: "TRUE_FALSE", prompt: "Active listening improves the likelihood of closing a sale.", correctOptionIndex: 0, points: 10, sortOrder: 1 },
        { type: "MCQ", prompt: "What does CRM stand for?", options: ["Customer Relationship Management", "Central Revenue Model", "Customer Retention Metric", "Client Reporting Method"], correctOptionIndex: 0, points: 10, sortOrder: 2 },
        { type: "TRUE_FALSE", prompt: "Following up with a lead within 24 hours increases conversion rates.", correctOptionIndex: 0, points: 10, sortOrder: 3 },
      ],
    },
    registry.aroha.userId
  );
  await publishAssessment(tc, salesJob.id, registry.aroha.userId);

  await createJob(
    tc,
    {
      title: "Marketing Intern",
      vacancyCount: 1,
      location: "Auckland, NZ",
      skills: ["Social Media", "Content Writing"],
      jobType: "INTERNSHIP",
      salaryType: "HOURLY",
      salaryMin: 22,
      salaryMax: 25,
      description: "<p>3-month marketing internship supporting campaigns and content.</p>",
      departmentId: deptByName["Sales & Marketing"],
      screeningQuestions: [],
    },
    registry.aroha.userId
  ); // left Draft — never published

  const opsJob = await createJob(
    tc,
    {
      title: "Operations Analyst",
      vacancyCount: 1,
      location: "Remote",
      skills: ["Excel", "Process Improvement"],
      jobType: "FULL_TIME",
      salaryType: "ANNUAL",
      salaryMin: 60000,
      salaryMax: 75000,
      description: "<p>Support process improvement initiatives across Operations.</p>",
      departmentId: deptByName["Operations"],
      screeningQuestions: [],
    },
    admin.id
  );
  await publishJob(tc, opsJob.id, admin.id);
  await closeJob(tc, opsJob.id, admin.id); // demonstrates the Closed lifecycle state

  // Mirrors submitApplication's DB writes (candidate.repository.ts's findOrCreateCandidate
  // + the application/answers/stage-history transaction) without its trailing "send an
  // application-received email" step. That call is awaited inside a try/catch that only
  // swallows a thrown error, not a hang — with no SMTP_HOST configured it falls back to
  // auto-creating an Ethereal test inbox, an outbound network call with no bounded
  // timeout, so on a machine without internet access every application submitted here
  // would hang the seeder indefinitely rather than failing fast.
  async function apply(
    jobId: number,
    fullName: string,
    email: string,
    phoneNumber: string,
    answers: Array<{ jobScreeningQuestionId: number; answerText: string }>
  ): Promise<{ id: number }> {
    const candidate = await tc.candidate.upsert({
      where: { email },
      update: { fullName, phoneNumber },
      create: { fullName, email, phoneNumber },
    });
    return tc.$transaction(async (txx) => {
      const application = await txx.application.create({
        data: { jobId, candidateId: candidate.id, coverLetter: `Excited to apply for this role at ${DEMO_TENANT.name}.` },
      });
      if (answers.length > 0) {
        await txx.applicationAnswer.createMany({
          data: answers.map((a) => ({ applicationId: application.id, jobScreeningQuestionId: a.jobScreeningQuestionId, answerText: a.answerText })),
        });
      }
      await txx.applicationStageHistory.create({ data: { applicationId: application.id, toStage: "APPLICATION_RECEIVED", movedByType: "System" } });
      return application;
    });
  }

  const [engRtw, engAge] = engJob.screeningQuestions;
  const [salesAge] = salesJob.screeningQuestions;

  const ravi = await apply(engJob.id, "Ravi Kumar", "ravi.kumar@example.com", "+64211234501", [
    { jobScreeningQuestionId: engRtw.id, answerText: "Yes" },
    { jobScreeningQuestionId: engAge.id, answerText: "Yes" },
  ]);
  const mei = await apply(engJob.id, "Mei Lin", "mei.lin@example.com", "+64211234502", [
    { jobScreeningQuestionId: engRtw.id, answerText: "Yes" },
    { jobScreeningQuestionId: engAge.id, answerText: "Yes" },
  ]);
  const ben = await apply(engJob.id, "Ben Walker", "ben.walker@example.com", "+64211234503", [
    { jobScreeningQuestionId: engRtw.id, answerText: "Yes" },
    { jobScreeningQuestionId: engAge.id, answerText: "Yes" },
  ]);
  await apply(engJob.id, "Aisha Patel", "aisha.patel@example.com", "+64211234504", [
    { jobScreeningQuestionId: engRtw.id, answerText: "Yes" },
    { jobScreeningQuestionId: engAge.id, answerText: "Yes" },
  ]); // left fresh at APPLICATION_RECEIVED

  const tom = await apply(salesJob.id, "Tom Richards", "tom.richards@example.com", "+64211234505", [
    { jobScreeningQuestionId: salesAge.id, answerText: "Yes" },
  ]);
  await apply(salesJob.id, "Zara Ahmed", "zara.ahmed@example.com", "+64211234506", [
    { jobScreeningQuestionId: salesAge.id, answerText: "Yes" },
  ]); // left fresh at APPLICATION_RECEIVED

  // No SHORT_TEXT questions in either assessment above, so every answer here grades
  // instantly (MCQ/TRUE_FALSE) — nothing lands on the BullMQ grading queue, which
  // would otherwise hang indefinitely against the Redis-less local dev setup.
  const wrongIndex = (correct: number, optionCount: number) => (correct + 1) % optionCount;
  const allCorrect = (questions: { id: number; correctOptionIndex: number | null }[]) =>
    questions.map((q) => ({ questionId: q.id, selectedOptionIndex: q.correctOptionIndex ?? 0 }));

  // Moves an application into AI_ASSESSMENT and creates its invitation directly,
  // rather than via moveApplicationStage/inviteCandidateToAssessment. Those send a
  // real invite email, which (with no SMTP_HOST configured, per .env.example) falls
  // back to auto-creating an Ethereal test inbox — an outbound network call with no
  // bounded timeout, so on a machine without internet access this seeder would hang
  // indefinitely rather than failing fast. This replicates just the DB side of both
  // functions (stage + history + invitation row).
  async function moveToAssessmentStage(applicationId: number, assessmentId: number) {
    const application = await tc.application.findUniqueOrThrow({ where: { id: applicationId } });
    await tc.$transaction([
      tc.application.update({ where: { id: applicationId }, data: { stage: "AI_ASSESSMENT", movedToStageAt: new Date() } }),
      tc.applicationStageHistory.create({
        data: { applicationId, fromStage: application.stage, toStage: "AI_ASSESSMENT", movedByType: "User", movedById: admin.id },
      }),
    ]);
    const existingInvitation = await tc.assessmentInvitation.findUnique({ where: { applicationId } });
    if (!existingInvitation) {
      await tc.assessmentInvitation.create({ data: { applicationId, assessmentId } });
    }
  }

  // Ravi: aces the assessment, auto-advances to VIRTUAL_INTERVIEW, then walked through
  // to HIRED.
  await moveToAssessmentStage(ravi.id, engAssessment.id);
  await submitAssessmentAnswers(tc, ravi.id, { answers: allCorrect(engAssessment.questions) }, tenant.slug);
  let raviApp = await getApplicationById(tc, ravi.id);
  if (raviApp.stage === "AI_ASSESSMENT") raviApp = await moveApplicationStage(tc, ravi.id, "VIRTUAL_INTERVIEW", admin.id);
  await moveApplicationStage(tc, ravi.id, "IN_PERSON_INTERVIEW", admin.id);
  await moveApplicationStage(tc, ravi.id, "OFFER", admin.id);
  await moveApplicationStage(tc, ravi.id, "HIRED", admin.id);

  // Mei: also aces it, left sitting at VIRTUAL_INTERVIEW — a mid-pipeline candidate.
  await moveToAssessmentStage(mei.id, engAssessment.id);
  await submitAssessmentAnswers(tc, mei.id, { answers: allCorrect(engAssessment.questions) }, tenant.slug);

  // Ben: answers everything wrong → FAILED → manually rejected.
  await moveToAssessmentStage(ben.id, engAssessment.id);
  await submitAssessmentAnswers(
    tc,
    ben.id,
    { answers: engAssessment.questions.map((q) => ({ questionId: q.id, selectedOptionIndex: wrongIndex(q.correctOptionIndex ?? 0, q.options?.length ?? 2) })) },
    tenant.slug
  );
  const benApp = await getApplicationById(tc, ben.id);
  if (benApp.stage !== "REJECTED") {
    await moveApplicationStage(tc, ben.id, "REJECTED", admin.id, { rejectionReason: "Did not meet the technical assessment threshold" });
  }

  // Tom: aces the sales quiz, auto-advances, then walked to OFFER.
  await moveToAssessmentStage(tom.id, salesAssessment.id);
  await submitAssessmentAnswers(tc, tom.id, { answers: allCorrect(salesAssessment.questions) }, tenant.slug);
  let tomApp = await getApplicationById(tc, tom.id);
  if (tomApp.stage === "AI_ASSESSMENT") tomApp = await moveApplicationStage(tc, tom.id, "VIRTUAL_INTERVIEW", admin.id);
  await moveApplicationStage(tc, tom.id, "OFFER", admin.id);

  // ── Payroll: a full fortnightly cycle for every employee — pay rates,
  // attendance-derived work reports, HR approval, and two payroll runs (one
  // fully PAID, one left PENDING_PAYMENT for Finance to action live) ───────
  const payCycle = await createPayCycle(tc, { name: "Standard Fortnightly", frequency: "FORTNIGHTLY" }, admin.id);
  await assignEmployeesToPayCycle(
    tc,
    payCycle.id,
    Object.values(registry).map((e) => e.employeeId)
  );

  const RATE_EFFECTIVE_FROM = `${YEAR}-01-01`;
  async function payRate(employeeId: number, rateType: "HOURLY" | "SALARY", baseRate: number) {
    await createPayRate(tc, { employeeId, rateType, baseRate, effectiveFrom: RATE_EFFECTIVE_FROM }, admin.id);
  }
  await payRate(registry.admin.employeeId, "SALARY", 6500);
  await payRate(registry.priya.employeeId, "SALARY", 4200);
  await payRate(registry.james.employeeId, "SALARY", 4600);
  await payRate(registry.aroha.employeeId, "SALARY", 4000);
  await payRate(registry.meera.employeeId, "SALARY", 3400);
  await payRate(registry.david.employeeId, "SALARY", 4400);
  await payRate(registry.liam.employeeId, "HOURLY", 55);
  await payRate(registry.sophie.employeeId, "HOURLY", 42);
  await payRate(registry.noah.employeeId, "HOURLY", 40);
  await payRate(registry.grace.employeeId, "HOURLY", 32);
  await payRate(registry.ethan.employeeId, "HOURLY", 30);
  await payRate(registry.isabella.employeeId, "HOURLY", 34);
  await payRate(registry.mason.employeeId, "HOURLY", 29);

  const periodA = { start: addDays(TODAY, -13), end: addDays(TODAY, -7) };
  const periodB = { start: addDays(TODAY, -6), end: addDays(TODAY, -1) };

  const reportsA = await generateWorkReportsForPeriod(tc, payCycle.id, periodA.start, periodA.end, registry.meera.userId);
  for (const report of reportsA) await approveWorkReport(tc, report.id, registry.priya.userId);
  const runA = await generateDraftPayrollRun(tc, payCycle.id, periodA.start, periodA.end, addDays(TODAY, -5), registry.meera.userId);
  await submitPayrollForPayment(tc, runA.id, registry.meera.userId);
  // Mirrors decidePayrollRunPayment's "Approve" DB transaction (payrollRun.service.ts)
  // without its final step of enqueueing payslip-PDF / IRD-filing BullMQ jobs — those
  // require a running worker + Redis, which the documented local-dev setup doesn't
  // provision (see the redisConnection comment above), and would otherwise hang this
  // script indefinitely waiting to enqueue.
  await tc.$transaction([
    tc.payrollRun.update({ where: { id: runA.id }, data: { status: "PAID", decidedById: registry.david.userId, decidedAt: new Date() } }),
    tc.payslip.updateMany({ where: { payrollRunId: runA.id }, data: { status: "PUBLISHED" } }),
  ]);

  const reportsB = await generateWorkReportsForPeriod(tc, payCycle.id, periodB.start, periodB.end, registry.meera.userId);
  for (const report of reportsB) await approveWorkReport(tc, report.id, registry.priya.userId);
  const runB = await generateDraftPayrollRun(tc, payCycle.id, periodB.start, periodB.end, addDays(TODAY, 2), registry.meera.userId);
  await submitPayrollForPayment(tc, runB.id, registry.meera.userId); // left PENDING_PAYMENT for Finance to decide live

  console.log("Full demo dataset seeded: org structure, rosters/attendance, leave, documents, assets, ATS, and payroll.");
}

async function main(): Promise<void> {
  await seedSaasAdmin();
  await seedDemoTenant();
  console.log("\nDemo seed complete — credentials match README 'Demo login details'.");
}

// Guarded so this module can be imported (e.g. by scripts/_test-full-seed.ts, or any
// future harness) without re-running the whole seed as an import side effect.
if (require.main === module) {
  main()
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(async () => {
      await controlClient.$disconnect();
      redisConnection.disconnect();
      // A fire-and-forget notification email (leave/document decisions, asset
      // assignment receipts) may still have an in-flight request keeping the event
      // loop alive — force the process to end instead of hanging the CLI.
      process.exit(process.exitCode ?? 0);
    });
}
