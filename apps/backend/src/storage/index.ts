import { env } from "../config/env";
import { LocalStorageDriver } from "./localStorageDriver";
import { S3StorageDriver } from "./s3StorageDriver";
import { StorageDriver } from "./storageDriver";

export type { StorageDriver, StoredFile, SaveFileInput } from "./storageDriver";
export { LOCAL_UPLOAD_ROOT } from "./localStorageDriver";

let driver: StorageDriver | undefined;

export function getStorageDriver(): StorageDriver {
  if (!driver) {
    driver = env.STORAGE_DRIVER === "s3" ? new S3StorageDriver() : new LocalStorageDriver();
  }
  return driver;
}
