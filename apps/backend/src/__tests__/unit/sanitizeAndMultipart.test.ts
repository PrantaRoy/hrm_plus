import { stripHtml } from "../../utils/sanitize";
import { multipartBoolean } from "../../utils/zodMultipart";

describe("stripHtml", () => {
  it("removes all tags and attributes, keeping text", () => {
    expect(stripHtml("<b>bold</b> <a href='http://x' onclick='x()'>link</a>")).toBe("bold link");
  });

  it("drops script/style content entirely", () => {
    expect(stripHtml("hi<script>alert(1)</script>there")).toBe("hithere");
    expect(stripHtml("<style>body{}</style>ok")).toBe("ok");
  });

  it("neutralizes event-handler and javascript: payloads", () => {
    const out = stripHtml('<img src=x onerror="alert(1)"><svg onload=alert(1)>text</svg>');
    expect(out).not.toMatch(/<|onerror|onload/);
    expect(out).toContain("text");
  });

  it("trims whitespace and leaves plain text alone", () => {
    expect(stripHtml("   plain text   ")).toBe("plain text");
  });
});

describe("multipartBoolean", () => {
  it("parses the string encodings multipart forms send", () => {
    expect(multipartBoolean.parse("true")).toBe(true);
    expect(multipartBoolean.parse("false")).toBe(false);
  });

  it("passes real booleans through", () => {
    expect(multipartBoolean.parse(true)).toBe(true);
    expect(multipartBoolean.parse(false)).toBe(false);
  });

  it.each(["yes", "1", "", "TRUE", 1, null, undefined])("rejects %p", (value) => {
    expect(multipartBoolean.safeParse(value).success).toBe(false);
  });
});
