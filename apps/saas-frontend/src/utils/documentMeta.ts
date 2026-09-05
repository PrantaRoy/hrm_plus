const DEFAULT_TITLE = "HRM PLUS";

/** Client-side title + meta-description management for public SPA pages. */
export function setDocumentMeta({
  title,
  description,
}: {
  title?: string | null;
  description?: string | null;
}): void {
  if (title) document.title = title;

  if (description !== undefined) {
    let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.name = "description";
      document.head.appendChild(tag);
    }
    tag.content = description ?? "";
  }
}

export function resetDocumentMeta(): void {
  document.title = DEFAULT_TITLE;
}
