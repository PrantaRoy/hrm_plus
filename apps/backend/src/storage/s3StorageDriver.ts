import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import path from "node:path";
import type { Readable } from "node:stream";
import { env } from "../config/env";
import { SaveFileInput, StorageDriver, StoredFile } from "./storageDriver";

export class S3StorageDriver implements StorageDriver {
  private client: S3Client;
  private bucket: string;

  constructor() {
    if (!env.AWS_S3_BUCKET || !env.AWS_REGION || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
      throw new Error(
        "STORAGE_DRIVER=s3 requires AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY to be set"
      );
    }
    this.bucket = env.AWS_S3_BUCKET;
    this.client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async save({ buffer, originalName, mimeType, folder }: SaveFileInput): Promise<StoredFile> {
    const ext = path.extname(originalName).toLowerCase();
    const key = `${folder}/${nanoid(12)}${ext}`;

    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: mimeType })
    );

    const url = env.AWS_S3_PUBLIC_BASE_URL
      ? `${env.AWS_S3_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`
      : `https://${this.bucket}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

    return { key, url };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async read(key: string): Promise<Buffer> {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const stream = result.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}
