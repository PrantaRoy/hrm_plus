import { z } from "zod";

// multipart/form-data always sends field values as strings, so a plain z.boolean()
// rejects "true"/"false" text and z.coerce.boolean() treats any non-empty string
// (including "false") as true. This preprocesses the common string encodings first.
export const multipartBoolean = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());
