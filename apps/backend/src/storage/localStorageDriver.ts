import fs from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";
import { env } from "../config/env";
import { SaveFileInput, StorageDriver, StoredFile } from "./storageDriver";

export const LOCAL_UPLOAD_ROOT = path.join(__dirname, "..", "..", env.LOCAL_UPLOAD_DIR);

export class LocalStorageDriver implements StorageDriver {
  async save({ buffer, originalName, folder }: SaveFileInput): Promise<StoredFile> {
    const ext = path.extname(originalName).toLowerCase();
    const filename = `${nanoid(12)}${ext}`;
    const dir = path.join(LOCAL_UPLOAD_ROOT, folder);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), buffer);

    const key = `${folder}/${filename}`;
    return { key, url: `/uploads/${key}` };
  }

  async delete(key: string): Promise<void> {
    await fs.rm(path.join(LOCAL_UPLOAD_ROOT, key), { force: true });
  }
}
