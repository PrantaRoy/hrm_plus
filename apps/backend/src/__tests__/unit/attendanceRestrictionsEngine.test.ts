import { enforceAttendanceRestrictions } from "../../modules/attendance/attendanceRestrictions.service";

// White-box tests of the rule engine with Prisma mocked out — complements the DB-backed
// attendanceRestrictions.test.ts, which exercises the same rules through HTTP.
interface Fixture {
  rules?: { ipBindingEnabled?: boolean; locationBindingEnabled?: boolean; deviceBindingEnabled?: boolean } | null;
  ipRules?: Array<{ cidr: string; status: string }>;
  locations?: Array<{ name: string; latitude: number; longitude: number; radiusMeters: number; status: string }>;
  device?: { id: number; employeeId: number; status: string } | null;
}

function makePrisma(f: Fixture) {
  const rules = f.rules === null ? null : { ipBindingEnabled: false, locationBindingEnabled: false, deviceBindingEnabled: false, ...f.rules };
  return {
    employeeAttendanceRules: { findUnique: jest.fn().mockResolvedValue(f.rules === undefined ? null : rules) },
    employeeAttendanceIpRule: { findMany: jest.fn().mockResolvedValue((f.ipRules ?? []).map((ipRule) => ({ ipRule }))) },
    employeeAttendanceLocation: { findMany: jest.fn().mockResolvedValue((f.locations ?? []).map((location) => ({ location }))) },
    employeeAttendanceDevice: {
      findUnique: jest.fn().mockResolvedValue(f.device ?? null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
  };
}

const run = (f: Fixture, input: Parameters<typeof enforceAttendanceRestrictions>[2]) => {
  const prisma = makePrisma(f);
  return { prisma, promise: enforceAttendanceRestrictions(prisma as never, 1, input) };
};

describe("enforceAttendanceRestrictions", () => {
  it("allows everything when the employee has no rules row", async () => {
    await expect(run({ rules: undefined }, { ip: null }).promise).resolves.toBeUndefined();
  });

  it("allows everything when every binding is disabled", async () => {
    const { prisma, promise } = run({ rules: {} }, { ip: null });
    await expect(promise).resolves.toBeUndefined();
    expect(prisma.employeeAttendanceIpRule.findMany).not.toHaveBeenCalled();
  });

  describe("IP binding", () => {
    const rules = { ipBindingEnabled: true };

    it("conflicts when no active network is configured (inactive ones are ignored)", async () => {
      await expect(run({ rules, ipRules: [{ cidr: "10.0.0.0/8", status: "Inactive" }] }, { ip: "10.1.2.3" }).promise).rejects.toMatchObject({ status: 409 });
    });

    it("forbids when the client IP is unknown", async () => {
      await expect(run({ rules, ipRules: [{ cidr: "10.0.0.0/8", status: "Active" }] }, { ip: null }).promise).rejects.toMatchObject({
        status: 403,
        message: "Could not determine your network address",
      });
    });

    it.each([
      ["10.1.2.3", "10.0.0.0/8", true],
      ["10.255.255.255", "10.0.0.0/8", true],
      ["11.0.0.1", "10.0.0.0/8", false],
      ["192.168.1.50", "192.168.1.0/24", true],
      ["192.168.2.50", "192.168.1.0/24", false],
      ["203.0.113.7", "203.0.113.7/32", true],
      ["203.0.113.8", "203.0.113.7/32", false],
      ["::ffff:10.1.2.3", "10.0.0.0/8", true], // IPv4-mapped IPv6 as seen behind some proxies
      ["2001:db8::1", "2001:db8::/32", true],
      ["2001:db9::1", "2001:db8::/32", false],
      ["10.1.2.3", "2001:db8::/32", false], // family mismatch never matches
      ["10.1.2.3", "not-a-cidr", false], // malformed rule fails closed
      ["garbage", "10.0.0.0/8", false], // malformed IP fails closed
    ])("ip %s vs %s -> allowed=%s", async (ip, cidr, allowed) => {
      const { promise } = run({ rules, ipRules: [{ cidr, status: "Active" }] }, { ip });
      if (allowed) await expect(promise).resolves.toBeUndefined();
      else await expect(promise).rejects.toMatchObject({ status: 403, message: "You must check in from an approved network" });
    });

    it("passes when any one of several networks matches", async () => {
      const ipRules = [
        { cidr: "10.0.0.0/8", status: "Active" },
        { cidr: "192.168.0.0/16", status: "Active" },
      ];
      await expect(run({ rules, ipRules }, { ip: "192.168.9.9" }).promise).resolves.toBeUndefined();
    });
  });

  describe("location binding", () => {
    const rules = { locationBindingEnabled: true };
    // ~0.001 degree of latitude is ~111m.
    const office = { name: "HQ", latitude: 23.8103, longitude: 90.4125, radiusMeters: 200, status: "Active" };

    it("conflicts when no active location is configured", async () => {
      await expect(run({ rules, locations: [{ ...office, status: "Inactive" }] }, { ip: null, latitude: 1, longitude: 1 }).promise).rejects.toMatchObject({
        status: 409,
      });
    });

    it("requires coordinates (400)", async () => {
      await expect(run({ rules, locations: [office] }, { ip: null }).promise).rejects.toMatchObject({ status: 400 });
      await expect(run({ rules, locations: [office] }, { ip: null, latitude: 23.8 }).promise).rejects.toMatchObject({ status: 400 });
    });

    it("accepts 0,0 as a real coordinate pair (not treated as missing)", async () => {
      const equator = { ...office, latitude: 0, longitude: 0 };
      await expect(run({ rules, locations: [equator] }, { ip: null, latitude: 0, longitude: 0 }).promise).resolves.toBeUndefined();
    });

    it("accepts a point at the center and one inside the radius", async () => {
      await expect(run({ rules, locations: [office] }, { ip: null, latitude: 23.8103, longitude: 90.4125 }).promise).resolves.toBeUndefined();
      await expect(run({ rules, locations: [office] }, { ip: null, latitude: 23.8113, longitude: 90.4125 }).promise).resolves.toBeUndefined(); // ~111m
    });

    it("rejects a point outside the radius and names the nearest location", async () => {
      await expect(run({ rules, locations: [office] }, { ip: null, latitude: 23.8133, longitude: 90.4125 }).promise).rejects.toMatchObject({
        status: 403,
        message: "You are outside the allowed check-in location (must be within 200m of HQ)",
      });
    });

    it("measures longitude distance correctly away from the equator", async () => {
      // 0.003 deg of longitude at lat 23.8 is ~305m (< 111m*3 because of cos(lat)); outside a 200m fence, inside a 400m one.
      const probe = { ip: null, latitude: 23.8103, longitude: 90.4155 };
      await expect(run({ rules, locations: [office] }, probe).promise).rejects.toMatchObject({ status: 403 });
      await expect(run({ rules, locations: [{ ...office, radiusMeters: 400 }] }, probe).promise).resolves.toBeUndefined();
    });

    it("passes when within ANY configured location and reports the nearest one on failure", async () => {
      const branch = { name: "Branch", latitude: 22.3569, longitude: 91.7832, radiusMeters: 150, status: "Active" };
      await expect(run({ rules, locations: [office, branch] }, { ip: null, latitude: 22.3569, longitude: 91.7832 }).promise).resolves.toBeUndefined();
      await expect(run({ rules, locations: [office, branch] }, { ip: null, latitude: 22.4, longitude: 91.8 }).promise).rejects.toMatchObject({
        message: expect.stringContaining("Branch"),
      });
    });
  });

  describe("device binding", () => {
    const rules = { deviceBindingEnabled: true };

    it("requires a device token (400)", async () => {
      await expect(run({ rules }, { ip: null }).promise).rejects.toMatchObject({ status: 400 });
    });

    it("registers an unknown device as Pending and rejects it, citing the last 4 chars", async () => {
      const { prisma, promise } = run({ rules, device: null }, { ip: "1.2.3.4", deviceToken: "abcdef-wxyz" });
      await expect(promise).rejects.toMatchObject({ status: 403, message: expect.stringContaining("WXYZ") });
      expect(prisma.employeeAttendanceDevice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ employeeId: 1, deviceToken: "abcdef-wxyz", status: "Pending", lastSeenIp: "1.2.3.4" }),
      });
    });

    it("rejects a device that belongs to another employee without touching it", async () => {
      const { prisma, promise } = run({ rules, device: { id: 9, employeeId: 2, status: "Approved" } }, { ip: null, deviceToken: "tok" });
      await expect(promise).rejects.toMatchObject({ status: 403, message: "This device is registered to a different account" });
      expect(prisma.employeeAttendanceDevice.update).not.toHaveBeenCalled();
    });

    it("accepts an approved device and refreshes last-seen", async () => {
      const { prisma, promise } = run({ rules, device: { id: 9, employeeId: 1, status: "Approved" } }, { ip: "5.6.7.8", deviceToken: "tok" });
      await expect(promise).resolves.toBeUndefined();
      expect(prisma.employeeAttendanceDevice.update).toHaveBeenCalledWith({
        where: { id: 9 },
        data: expect.objectContaining({ lastSeenIp: "5.6.7.8" }),
      });
    });

    it("rejects pending and rejected devices (still recording the attempt)", async () => {
      const pending = run({ rules, device: { id: 9, employeeId: 1, status: "Pending" } }, { ip: null, deviceToken: "tok" });
      await expect(pending.promise).rejects.toMatchObject({ message: expect.stringContaining("not yet approved") });
      expect(pending.prisma.employeeAttendanceDevice.update).toHaveBeenCalled();

      const rejected = run({ rules, device: { id: 9, employeeId: 1, status: "Rejected" } }, { ip: null, deviceToken: "tok" });
      await expect(rejected.promise).rejects.toMatchObject({ message: "This device has been blocked for attendance. Contact HR." });
    });
  });

  it("checks rules in IP -> location -> device order and stops at the first failure", async () => {
    const { prisma, promise } = run(
      { rules: { ipBindingEnabled: true, locationBindingEnabled: true, deviceBindingEnabled: true }, ipRules: [{ cidr: "10.0.0.0/8", status: "Active" }] },
      { ip: "8.8.8.8" }
    );
    await expect(promise).rejects.toMatchObject({ message: "You must check in from an approved network" });
    expect(prisma.employeeAttendanceLocation.findMany).not.toHaveBeenCalled();
    expect(prisma.employeeAttendanceDevice.findUnique).not.toHaveBeenCalled();
  });
});
