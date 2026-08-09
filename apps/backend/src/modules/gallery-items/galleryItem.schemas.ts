import { z } from "zod";
import { multipartBoolean } from "../../utils/zodMultipart";

export const createGalleryItemSchema = z.object({
  title: z.string().trim().max(160).optional(),
  caption: z.string().trim().max(300).optional(),
  category: z.string().trim().max(80).optional(),
  isFeatured: multipartBoolean.default(false),
});

export const updateGalleryItemSchema = createGalleryItemSchema.partial();

export const reorderGalleryItemsSchema = z.object({
  orderedIds: z.array(z.number().int()).min(1),
});
