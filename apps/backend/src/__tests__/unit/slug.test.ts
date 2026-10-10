import { generateUniqueSlug, slugify } from "../../utils/slug";

describe("slugify", () => {
  it.each([
    ["Hello World", "hello-world"],
    ["  Trim  Me  ", "trim-me"],
    ["Rock & Roll!!", "rock-roll"],
    ["---already--dashed---", "already-dashed"],
    ["Ünïcode Títle", "n-code-t-tle"],
    ["2026 Q1 Report", "2026-q1-report"],
    ["!!!", ""],
    ["", ""],
  ])("slugify(%j) -> %j", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});

describe("generateUniqueSlug", () => {
  it("returns the base slug when it is free", async () => {
    const exists = jest.fn().mockResolvedValue(false);
    await expect(generateUniqueSlug("My Post", "post", exists)).resolves.toBe("my-post");
    expect(exists).toHaveBeenCalledWith("my-post");
  });

  it("appends a 6-char lowercase suffix when the base is taken", async () => {
    const exists = jest.fn().mockResolvedValue(true);
    const slug = await generateUniqueSlug("My Post", "post", exists);
    expect(slug).toMatch(/^my-post-[a-z0-9_-]{6}$/);
    expect(slug).toBe(slug.toLowerCase());
  });

  it("falls back when the title slugifies to nothing", async () => {
    const exists = jest.fn().mockResolvedValue(false);
    await expect(generateUniqueSlug("!!!", "untitled", exists)).resolves.toBe("untitled");
  });
});
