/**
 * Standalone verification for the Meeting & Appointment Scheduler conflict matrix.
 * Provisions a throwaway tenant DB, seeds a roster + leave, and exercises
 * checkAvailability / meeting.service directly (no HTTP, no jest).
 *
 *   npx tsx scripts/verify-meeting-scheduler.ts
 */
import { getTenantClient } from "../src/db/tenantClientPool";
import { tenantDatabaseUrl } from "../src/config/env";
import {
  createTenantDatabase,
  dropTenantDatabase,
  runTenantMigrations,
  seedDefaultRoles,
} from "../src/modules/tenants/tenantProvisioning";
import { checkAvailability } from "../src/modules/meetings/meetingConflict.service";
import * as meetingService from "../src/modules/meetings/meeting.service";
import { getOrCreateSettings, updateSchedulerSettings } from "../src/modules/scheduler-settings/schedulerSettings.service";

const DB = `hrm_verify_meetings_${Date.now()}`;
let pass = 0;
let fail = 0;

function check(label: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.error(`  ✗ ${label}`);
  }
}

async function main() {
  await createTenantDatabase(DB);
  runTenantMigrations(tenantDatabaseUrl(DB));
  const prisma = getTenantClient(DB);
  const roles = await seedDefaultRoles(prisma);

  const org = await prisma.user.create({
    data: { email: "org@v.test", passwordHash: "x", roleId: roles.Staff },
  });
  const part = await prisma.user.create({
    data: { email: "part@v.test", passwordHash: "x", roleId: roles.Staff },
  });
  const dept = await prisma.department.create({ data: { name: "Dept" } });
  const organizer = await prisma.employee.create({
    data: { employeeCode: "E-ORG", firstName: "Olive", lastName: "Organizer", email: "org@v.test", joiningDate: new Date(), userId: org.id, departmentId: dept.id },
  });
  const participant = await prisma.employee.create({
    data: { employeeCode: "E-PART", firstName: "Pat", lastName: "Participant", email: "part@v.test", joiningDate: new Date(), userId: part.id, departmentId: dept.id },
  });

  const shift = await prisma.dutySchedule.create({
    data: { name: "Day", startTime: "09:00", endTime: "17:00" },
  });
  const roster = await prisma.roster.create({
    data: {
      departmentId: dept.id,
      periodType: "Weekly",
      startDate: new Date("2026-10-05T00:00:00Z"),
      endDate: new Date("2026-10-11T00:00:00Z"),
      status: "Approved",
      createdById: org.id,
    },
  });
  for (const employeeId of [organizer.id, participant.id]) {
    for (const d of ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"]) {
      await prisma.dutyScheduleAssignment.create({
        data: {
          rosterId: roster.id,
          employeeId,
          dutyScheduleId: shift.id,
          departmentId: dept.id,
          date: new Date(`${d}T00:00:00Z`),
          createdById: org.id,
        },
      });
    }
  }

  const leaveType = await prisma.leaveType.create({ data: { name: "Annual", assignedDays: 20 } });
  const alloc = await prisma.employeeLeaveAllocation.create({
    data: { employeeId: participant.id, leaveTypeId: leaveType.id, year: 2026, allocatedDays: 20, createdById: org.id },
  });
  await prisma.leaveRequest.create({
    data: { employeeId: participant.id, allocationId: alloc.id, startDate: new Date("2026-10-06T00:00:00Z"), endDate: new Date("2026-10-06T00:00:00Z"), daysRequested: 1, status: "Approved", createdById: org.id },
  });
  await prisma.leaveRequest.create({
    data: { employeeId: participant.id, allocationId: alloc.id, startDate: new Date("2026-10-07T00:00:00Z"), endDate: new Date("2026-10-07T00:00:00Z"), daysRequested: 1, status: "Pending", createdById: org.id },
  });

  await getOrCreateSettings(prisma);
  const parts = [
    { employeeId: organizer.id, isRequired: true },
    { employeeId: participant.id, isRequired: true },
  ];

  console.log("clear slot inside shift:");
  const r1 = await checkAvailability(prisma, {
    startAt: new Date("2026-10-05T10:00:00Z"),
    endAt: new Date("2026-10-05T11:00:00Z"),
    participants: parts,
  });
  check("no conflicts", r1.conflicts.length === 0);
  check("canConfirm", r1.canConfirm);

  console.log("approved leave:");
  const r2 = await checkAvailability(prisma, {
    startAt: new Date("2026-10-06T10:00:00Z"),
    endAt: new Date("2026-10-06T11:00:00Z"),
    participants: parts,
  });
  const leaveConflict = r2.conflicts.find((c) => c.type === "APPROVED_LEAVE");
  check("APPROVED_LEAVE present", !!leaveConflict);
  check("severity BLOCK", leaveConflict?.severity === "BLOCK");
  check("names participant", leaveConflict?.message.includes("Pat Participant") ?? false);
  check("cannot confirm", !r2.canConfirm);

  console.log("pending leave (warn by default):");
  const r3 = await checkAvailability(prisma, {
    startAt: new Date("2026-10-07T10:00:00Z"),
    endAt: new Date("2026-10-07T11:00:00Z"),
    participants: parts,
  });
  const pend = r3.conflicts.find((c) => c.type === "PENDING_LEAVE");
  check("PENDING_LEAVE warning", pend?.severity === "WARNING");
  check("canConfirm true", r3.canConfirm);
  check("hasWarnings true", r3.hasWarnings);

  console.log("outside shift hours:");
  const r4 = await checkAvailability(prisma, {
    startAt: new Date("2026-10-08T18:00:00Z"),
    endAt: new Date("2026-10-08T19:00:00Z"),
    participants: parts,
  });
  check("OUTSIDE_SHIFT warning", r4.conflicts.some((c) => c.type === "OUTSIDE_SHIFT" && c.severity === "WARNING"));

  console.log("service: create + confirm happy path:");
  const created = await meetingService.createMeeting(
    prisma,
    organizer.id,
    { title: "Planning", date: "2026-10-05", startTime: "10:00", endTime: "11:00", participants: [{ employeeId: participant.id }] },
    { id: org.id, role: "Staff" }
  );
  check("created as Draft", created.status === "Draft");
  const confirmed = await meetingService.confirmMeeting(prisma, created.id, { id: org.id, role: "Staff" }, false);
  check("confirmed", confirmed.status === "Confirmed");

  console.log("service: confirm blocked by approved leave:");
  const blockedMeeting = await meetingService.createMeeting(
    prisma,
    organizer.id,
    { title: "Review", date: "2026-10-06", startTime: "10:00", endTime: "11:00", participants: [{ employeeId: participant.id }] },
    { id: org.id, role: "Staff" }
  );
  let threw = false;
  try {
    await meetingService.confirmMeeting(prisma, blockedMeeting.id, { id: org.id, role: "Staff" }, true);
  } catch (err: any) {
    threw = true;
    check("409 conflict code", err.code === "MEETING_CONFLICT");
    check("carries conflict details", Array.isArray(err.details?.conflicts) && err.details.conflicts.length > 0);
  }
  check("confirm threw", threw);

  console.log("service: warnings need acknowledgement:");
  const warnMeeting = await meetingService.createMeeting(
    prisma,
    organizer.id,
    { title: "Sync", date: "2026-10-07", startTime: "10:00", endTime: "11:00", participants: [{ employeeId: participant.id }] },
    { id: org.id, role: "Staff" }
  );
  let warnThrew = false;
  try {
    await meetingService.confirmMeeting(prisma, warnMeeting.id, { id: org.id, role: "Staff" }, false);
  } catch (err: any) {
    warnThrew = true;
    check("unacknowledged code", err.code === "MEETING_WARNINGS_UNACKNOWLEDGED");
  }
  check("warn confirm threw", warnThrew);
  const okWarn = await meetingService.confirmMeeting(prisma, warnMeeting.id, { id: org.id, role: "Staff" }, true);
  check("confirmed with ack", okWarn.status === "Confirmed" && okWarn.warningsAcknowledged);

  console.log("overlap detection + configurable block:");
  const overlapCheck = await checkAvailability(prisma, {
    startAt: new Date("2026-10-05T10:30:00Z"),
    endAt: new Date("2026-10-05T11:30:00Z"),
    participants: parts,
  });
  check("MEETING_OVERLAP warning", overlapCheck.conflicts.some((c) => c.type === "MEETING_OVERLAP"));
  check("overlap does not block by default", overlapCheck.canConfirm);
  await updateSchedulerSettings(prisma, { blockOnMeetingOverlap: true }, org.id);
  const overlapCheck2 = await checkAvailability(prisma, {
    startAt: new Date("2026-10-05T10:30:00Z"),
    endAt: new Date("2026-10-05T11:30:00Z"),
    participants: parts,
  });
  check("overlap blocks once enabled", !overlapCheck2.canConfirm);
  await updateSchedulerSettings(prisma, { blockOnMeetingOverlap: false, blockOnPendingLeave: true }, org.id);
  const pendBlock = await checkAvailability(prisma, {
    startAt: new Date("2026-10-07T13:00:00Z"),
    endAt: new Date("2026-10-07T14:00:00Z"),
    participants: parts,
  });
  check("pending leave blocks once enabled", !pendBlock.canConfirm);

  console.log("RSVP:");
  const rsvp = await meetingService.respondToMeeting(prisma, created.id, { id: part.id, role: "Staff" }, part.id, "Declined");
  check("response recorded", rsvp.participants.find((p) => p.employeeId === participant.id)?.responseStatus === "Declined");

  console.log(`\n${pass} passed, ${fail} failed`);
}

main()
  .catch((err) => {
    console.error(err);
    fail++;
  })
  .finally(async () => {
    await dropTenantDatabase(DB).catch(() => undefined);
    process.exit(fail > 0 ? 1 : 0);
  });
