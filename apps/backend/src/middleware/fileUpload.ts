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
