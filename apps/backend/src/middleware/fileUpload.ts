import multer from "multer";

export interface UploadOptions {
  allowedMimeTypes: string[];
  maxSizeBytes: number;
}

export function createUploadMiddleware({ allowedMimeTypes, maxSizeBytes }: UploadOptions) {
  const allowed = new Set(allowedMimeTypes);
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSizeBytes },
    fileFilter: (_req, file, cb) => {
      if (!allowed.has(file.mimetype)) {
        cb(new Error("Unsupported file type"));
        return;
      }
      cb(null, true);
    },
  });
}

export const avatarUpload = createUploadMiddleware({
  allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  maxSizeBytes: 2 * 1024 * 1024,
});

export const documentUpload = createUploadMiddleware({
  allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
  maxSizeBytes: 10 * 1024 * 1024,
});

// PNG/WebP only (not JPEG) so signature stamps keep a transparent background when
// composited onto rendered documents.
export const signatureUpload = createUploadMiddleware({
  allowedMimeTypes: ["image/png", "image/webp"],
  maxSizeBytes: 1 * 1024 * 1024,
});

export const logoUpload = createUploadMiddleware({
  allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
  maxSizeBytes: 2 * 1024 * 1024,
});

export const faviconUpload = createUploadMiddleware({
  allowedMimeTypes: ["image/png", "image/webp", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"],
  maxSizeBytes: 512 * 1024,
});

export const resumeUpload = createUploadMiddleware({
  allowedMimeTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  maxSizeBytes: 10 * 1024 * 1024,
});

export const heroMediaUpload = createUploadMiddleware({
  allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "video/mp4", "video/webm"],
  maxSizeBytes: 20 * 1024 * 1024,
});

export const galleryImageUpload = createUploadMiddleware({
  allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  maxSizeBytes: 5 * 1024 * 1024,
});

export const blogFeaturedImageUpload = createUploadMiddleware({
  allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  maxSizeBytes: 5 * 1024 * 1024,
});
