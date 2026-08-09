import { nanoid } from "nanoid";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

export async function generateUniqueSlug(
  title: string,
  fallback: string,
  existsCheck: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = slugify(title) || fallback;
  const exists = await existsCheck(base);
  if (!exists) return base;
  return `${base}-${nanoid(6).toLowerCase()}`;
}
