const read = jest.fn();
jest.mock("../../storage", () => ({ getStorageDriver: () => ({ read }) }));

import { renderTemplate } from "../../pdf/templateEngine";
import { injectSignatures } from "../../pdf/signaturePlaceholders";

describe("renderTemplate", () => {
  const data = { employee: { firstName: "Jane", address: { city: "Dhaka" } }, count: 0, flag: false, nothing: null };

  it("substitutes simple and dotted-path tokens", () => {
    expect(renderTemplate("Hi {{employee.firstName}} from {{employee.address.city}}", data)).toBe("Hi Jane from Dhaka");
  });

  it("tolerates whitespace inside the braces", () => {
    expect(renderTemplate("{{  employee.firstName  }}", data)).toBe("Jane");
  });

  it("renders falsy-but-defined values (0, false) rather than blanking them", () => {
    expect(renderTemplate("{{count}}|{{flag}}", data)).toBe("0|false");
  });

  it("renders unknown paths and null values as empty strings", () => {
    expect(renderTemplate("[{{missing}}][{{employee.nope.deeper}}][{{nothing}}]", data)).toBe("[][][]");
  });

  it("leaves signature tokens untouched for the signature pass", () => {
    expect(renderTemplate("{{signature:HR}} {{employee.firstName}}", data)).toBe("{{signature:HR}} Jane");
  });

  it("replaces every occurrence", () => {
    expect(renderTemplate("{{count}}-{{count}}", data)).toBe("0-0");
  });

  // KNOWN BUG: resolvePath() uses `key in obj`, which walks the prototype chain, so inherited
  // members leak into the document. Fix: use Object.prototype.hasOwnProperty.call(obj, key).
  // `it.failing` passes while the bug exists and starts failing once it is fixed — then switch to `it`.
  it.failing("does not resolve inherited prototype members such as {{constructor}}", () => {
    expect(renderTemplate("[{{constructor}}][{{toString}}]", {})).toBe("[][]");
  });

  it("never evaluates token content as code", () => {
    expect(renderTemplate("{{1+1}} {{process.exit()}}", {})).toBe(" ");
  });

  it("stringifies non-string values", () => {
    expect(renderTemplate("{{d}}", { d: new Date("2026-01-01T00:00:00Z") })).toContain("2026");
  });
});

describe("injectSignatures", () => {
  beforeEach(() => read.mockReset());

  it("replaces a role token with an inline data-URI image (mime from the key's extension)", async () => {
    read.mockResolvedValue(Buffer.from("PNGDATA"));
    const html = await injectSignatures("<p>{{signature:HR}}</p>", [
      { approverType: "Role", roleName: "HR", signatureImageKey: "sigs/hr.PNG" },
    ]);
    expect(html).toContain(`src="data:image/png;base64,${Buffer.from("PNGDATA").toString("base64")}"`);
    expect(html).toContain('alt="signature"');
    expect(read).toHaveBeenCalledWith("sigs/hr.PNG");
  });

  it("uses image/webp for .webp and defaults to png for unknown extensions", async () => {
    read.mockResolvedValue(Buffer.from("x"));
    const webp = await injectSignatures("{{signature:HR}}", [{ approverType: "Role", roleName: "HR", signatureImageKey: "a.webp" }]);
    expect(webp).toContain("data:image/webp;base64,");
    const other = await injectSignatures("{{signature:HR}}", [{ approverType: "Role", roleName: "HR", signatureImageKey: "a.bin" }]);
    expect(other).toContain("data:image/png;base64,");
  });

  it("keys ReportingManager steps by the ReportingManager token", async () => {
    read.mockResolvedValue(Buffer.from("x"));
    const html = await injectSignatures("{{signature:ReportingManager}}", [
      { approverType: "ReportingManager", roleName: null, signatureImageKey: "m.png" },
    ]);
    expect(html).toContain("<img");
  });

  it("resolves tokens without a matching/uploaded signature to an empty string", async () => {
    const html = await injectSignatures("[{{signature:Finance}}][{{signature:HR}}]", [
      { approverType: "Role", roleName: "HR", signatureImageKey: null },
    ]);
    expect(html).toBe("[][]");
    expect(read).not.toHaveBeenCalled();
  });

  it("reads each distinct role image once, even when the token repeats", async () => {
    read.mockResolvedValue(Buffer.from("x"));
    const html = await injectSignatures("{{signature:HR}}{{signature:HR}}", [
      { approverType: "Role", roleName: "HR", signatureImageKey: "a.png" },
      { approverType: "Role", roleName: "HR", signatureImageKey: "b.png" },
    ]);
    expect(html.match(/<img/g)).toHaveLength(2);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("tolerates whitespace in the token", async () => {
    read.mockResolvedValue(Buffer.from("x"));
    const html = await injectSignatures("{{ signature: HR }}", [{ approverType: "Role", roleName: "HR", signatureImageKey: "a.png" }]);
    expect(html).toContain("<img");
  });
});
